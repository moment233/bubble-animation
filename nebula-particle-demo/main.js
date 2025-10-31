import * as THREE from "three";
import ParticleSystem, {
  Alpha,
  Color,
  Emitter,
  Life,
  Mass,
  PointZone,
  Position,
  RadialVelocity,
  Radius,
  Rate,
  Scale,
  Span,
  SpriteRenderer,
  Vector3D,
} from "three-nebula";

const canvas = document.querySelector("#webgl");

// 场景设置
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// 相机（固定位置）
const camera = new THREE.PerspectiveCamera(
  60,
  sizes.width / sizes.height,
  1,
  1000
);
camera.position.set(0, 0, 200);
camera.lookAt(0, 0, 0);

// 渲染器
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 添加灯光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 50, 50);
scene.add(directionalLight);

// 全局变量
let hcolor = 0;
const particleSystem = new ParticleSystem();
const color1 = new THREE.Color();
const color2 = new THREE.Color();

// 添加渲染器
particleSystem.addRenderer(new SpriteRenderer(scene, THREE));

// 更新颜色
const updateColors = (hcolor = 0) => {
  color1.setHSL(hcolor - (hcolor >> 0), 1, 0.5);
  color2.setHSL(hcolor - (hcolor >> 0) + 0.3, 1, 0.5);
};

// 几何体管理数组
const geometryObjects = [];

// 创建几何体
const geometriesConfig = [
  { type: "box", position: [-80, 40, 0], size: 30 },
  { type: "sphere", position: [80, 40, 0], size: 20 },
  { type: "torus", position: [-80, -40, 0], size: [15, 6, 16, 50] },
  { type: "cone", position: [0, 0, 0], size: [18, 35, 32] },
  { type: "cylinder", position: [80, -40, 0], size: [15, 15, 35, 32] },
];

geometriesConfig.forEach((config) => {
  let geometry;

  switch (config.type) {
    case "box":
      geometry = new THREE.BoxGeometry(config.size, config.size, config.size);
      break;
    case "sphere":
      geometry = new THREE.SphereGeometry(config.size, 32, 32);
      break;
    case "torus":
      geometry = new THREE.TorusGeometry(...config.size);
      break;
    case "cone":
      geometry = new THREE.ConeGeometry(...config.size);
      break;
    case "cylinder":
      geometry = new THREE.CylinderGeometry(...config.size);
      break;
  }

  const material = new THREE.MeshStandardMaterial({
    color: 0x4fc3f7,
    metalness: 0.3,
    roughness: 0.4,
    transparent: true,
    opacity: 1,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...config.position);
  scene.add(mesh);

  geometryObjects.push({
    mesh,
    geometry,
    material,
    position: new THREE.Vector3(...config.position),
    state: "normal",
    sampledPoints: null,
    regenerateTimer: null,
  });
});

// 几何体表面采样函数
function sampleGeometryPoints(geometry, mesh, density = 3) {
  const positions = geometry.attributes.position;
  const points = [];
  const worldMatrix = mesh.matrixWorld;

  // 每隔 density 个顶点采样一个
  for (let i = 0; i < positions.count; i += density) {
    const vertex = new THREE.Vector3(
      positions.getX(i),
      positions.getY(i),
      positions.getZ(i)
    );

    // 转换到世界坐标
    vertex.applyMatrix4(worldMatrix);
    points.push(vertex);
  }

  return points;
}

// 点击检测
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

canvas.addEventListener("click", (event) => {
  // 计算归一化鼠标坐标
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // 获取可点击的几何体（只检测 normal 状态的）
  const clickableMeshes = geometryObjects
    .filter((obj) => obj.state === "normal")
    .map((obj) => obj.mesh);

  const intersects = raycaster.intersectObjects(clickableMeshes);

  if (intersects.length > 0) {
    const intersectedMesh = intersects[0].object;
    const clickPoint = intersects[0].point;

    const geoObj = geometryObjects.find((obj) => obj.mesh === intersectedMesh);
    if (geoObj) {
      disintegrateGeometry(geoObj, clickPoint);
    }
  }
});

// 粒子管理数组
const activeParticles = [];

// 瓦解几何体函数
function disintegrateGeometry(geoObj, clickPoint) {
  if (geoObj.state !== "normal") return;

  geoObj.state = "disintegrating";
  geoObj.mesh.visible = false;

  // 更新世界矩阵
  geoObj.mesh.updateMatrixWorld(true);

  // 采样几何体表面点
  const sampledPoints = sampleGeometryPoints(geoObj.geometry, geoObj.mesh, 3);

  console.log(
    `💥 瓦解几何体，采样点数: ${sampledPoints.length}，点击位置:`,
    clickPoint
  );

  // 为每个采样点创建粒子
  sampledPoints.forEach((point, index) => {
    // 计算距离用于延迟
    const distance = point.distanceTo(clickPoint);
    const delay = distance * 10; // 延迟（毫秒）

    // 计算速度方向（从点击位置指向采样点）
    const direction = new THREE.Vector3()
      .subVectors(point, clickPoint)
      .normalize();

    const speed = 0.5 + Math.random() * 0.3;
    const velocity = direction.multiplyScalar(speed);

    setTimeout(() => {
      // 创建粒子几何体
      const particleGeometry = new THREE.SphereGeometry(1.5, 8, 8);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: color1.clone(),
        transparent: true,
        opacity: 1,
      });

      const particleMesh = new THREE.Mesh(particleGeometry, particleMaterial);
      particleMesh.position.copy(point);
      scene.add(particleMesh);

      // 存储粒子信息
      activeParticles.push({
        mesh: particleMesh,
        velocity: velocity.clone(),
        life: 1.0,
        decay: 0.01 + Math.random() * 0.01,
        startColor: color1.clone(),
        endColor: color2.clone(),
        startTime: performance.now(),
      });
    }, delay);
  });

  // 设置重新生成定时器
  const totalDuration = 3000; // 3秒后开始重新生成
  geoObj.regenerateTimer = setTimeout(() => {
    regenerateGeometry(geoObj);
  }, totalDuration);
}

// 重新生成几何体
function regenerateGeometry(geoObj) {
  geoObj.state = "regenerating";

  // 淡入动画
  const fadeInDuration = 500; // 0.5秒
  const startTime = performance.now();
  geoObj.material.opacity = 0;
  geoObj.mesh.visible = true;

  function fadeIn() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / fadeInDuration, 1);

    geoObj.material.opacity = progress;

    if (progress < 1) {
      requestAnimationFrame(fadeIn);
    } else {
      geoObj.state = "normal";
      console.log("✨ 几何体重新生成完成");
    }
  }

  fadeIn();
}

// 更新粒子函数
function updateParticles() {
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const particle = activeParticles[i];

    // 更新位置
    particle.mesh.position.add(particle.velocity);

    // 更新生命周期
    particle.life -= particle.decay;

    // 更新透明度和缩放
    particle.mesh.material.opacity = particle.life;
    const scale = 0.5 + particle.life * 0.5;
    particle.mesh.scale.setScalar(scale);

    // 更新颜色（混合）
    particle.mesh.material.color.lerpColors(
      particle.startColor,
      particle.endColor,
      1 - particle.life
    );

    // 粒子死亡
    if (particle.life <= 0) {
      scene.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      particle.mesh.material.dispose();
      activeParticles.splice(i, 1);
    }
  }
}

// 动画循环
const animate = () => {
  hcolor += 0.01;

  updateColors(hcolor);

  // 更新自定义粒子
  updateParticles();

  // 更新粒子系统
  particleSystem.update();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

// 窗口调整
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// 启动动画
animate();

console.log("✅ 几何体粒子瓦解系统已启动");
console.log("💡 点击任意几何体查看瓦解效果");
