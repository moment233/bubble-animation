import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { bubbleVertexShader, bubbleFragmentShader } from "./bubbleShader.js";

const canvas = document.querySelector("#webgl");

// 场景
const scene = new THREE.Scene();

// 尺寸
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// 相机
const camera = new THREE.PerspectiveCamera(
  60,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.z = 30;

// 渲染器
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 气泡数组
const bubbles = [];
const simplex = new SimplexNoise();

// 全局变量存储环境贴图
let envMapTexture = null;

// 加载 HDR 环境贴图
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  "/abc1.hdr",
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    // 使用黑色背景，让气泡的彩虹色更突出
    scene.background = new THREE.Color(0x000000);
    envMapTexture = texture;

    // 更新所有已创建的气泡材质
    bubbles.forEach((bubble) => {
      bubble.material.uniforms.envMap.value = envMapTexture;
      bubble.material.needsUpdate = true; // 强制材质更新
    });

    console.log("✅ HDR 环境贴图加载成功！气泡应该有环境反射效果了");
    console.log("📊 HDR 纹理信息:", texture);
  },
  (progress) => {
    console.log(
      "⏳ HDR 加载中...",
      Math.round((progress.loaded / progress.total) * 100) + "%"
    );
  },
  (error) => {
    console.error("❌ HDR 加载失败:", error);
    console.error("💡 请确保 radial_ramp_01.hdr 文件在 public 文件夹中");
  }
);

// 射线投射器用于点击检测
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// 气泡状态常量
const BUBBLE_STATE = {
  FLOATING: "floating",
  BURSTING: "bursting",
};

// 生成7个固定的气泡位置（确保它们不重叠）
function generateFixedPositions() {
  const positions = [];
  const minDistance = 9; // 气泡之间的最小距离，确保不重叠
  const maxAttempts = 100; // 最大尝试次数

  for (let i = 0; i < 7; i++) {
    let attempts = 0;
    let validPosition = false;
    let newPos;

    while (!validPosition && attempts < maxAttempts) {
      // 在屏幕范围内生成随机位置
      newPos = {
        x: (Math.random() - 0.5) * 30, // -15 到 15
        y: (Math.random() - 0.5) * 20, // -10 到 10
        z: (Math.random() - 0.5) * 20, // -10 到 10
      };

      // 检查与已有气泡的距离
      validPosition = true;
      for (let j = 0; j < positions.length; j++) {
        const dx = newPos.x - positions[j].x;
        const dy = newPos.y - positions[j].y;
        const dz = newPos.z - positions[j].z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < minDistance) {
          validPosition = false;
          break;
        }
      }

      attempts++;
    }

    positions.push(newPos);
  }

  return positions;
}

// 气泡配置：7个大气泡
const bubblesConfig = [
  {
    size: 3.2,
    scale: [1.1, 0.95, 1.0],
    speed: 18,
    spikes: 0.65,
    processing: 2.6,
    offset: 0,
  },
  {
    size: 2.8,
    scale: [0.95, 1.15, 1.0],
    speed: 22,
    spikes: 0.7,
    processing: 2.8,
    offset: 1.5,
  },
  {
    size: 3.5,
    scale: [1.05, 1.05, 1.0],
    speed: 15,
    spikes: 0.6,
    processing: 2.5,
    offset: 3.0,
  },
  {
    size: 2.6,
    scale: [1.15, 0.9, 1.0],
    speed: 20,
    spikes: 0.75,
    processing: 3.0,
    offset: 4.5,
  },
  {
    size: 3.0,
    scale: [2.5, 1.4, 1.0],
    speed: 19,
    spikes: 0.7,
    processing: 2.9,
    offset: 2.0,
  },
  {
    size: 3.3,
    scale: [1.2, 2.3, 1.0],
    speed: 16,
    spikes: 0.65,
    processing: 2.7,
    offset: 3.5,
  },
  {
    size: 2.9,
    scale: [1.9, 1.9, 1.0],
    speed: 21,
    spikes: 0.72,
    processing: 2.8,
    offset: 5.0,
  },
];

// 生成7个固定位置
const fixedPositions = generateFixedPositions();

// 创建气泡
bubblesConfig.forEach((config, index) => {
  const geometry = new THREE.SphereGeometry(config.size, 64, 64);
  const positionAttributeBase = geometry.getAttribute("position").clone();

  const material = new THREE.ShaderMaterial({
    vertexShader: bubbleVertexShader,
    fragmentShader: bubbleFragmentShader,
    uniforms: {
      uCameraPos: { value: camera.position },
      envMap: { value: envMapTexture }, // 环境贴图
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);

  // 使用预设的固定位置
  const fixedPos = fixedPositions[index];
  mesh.position.set(fixedPos.x, fixedPos.y, fixedPos.z);

  // 应用非均匀缩放
  if (config.scale) {
    mesh.scale.set(config.scale[0], config.scale[1], config.scale[2]);
  }

  scene.add(mesh);

  // 气泡数据对象
  bubbles.push({
    mesh,
    geometry,
    material,
    positionAttributeBase,
    speed: config.speed,
    spikes: config.spikes,
    processing: config.processing,
    offset: config.offset,
    size: config.size,
    baseScale: [...config.scale],
    fixedPosition: { ...fixedPos }, // 保存固定位置

    // 状态管理
    state: BUBBLE_STATE.FLOATING,
  });
});

// 点击事件监听
canvas.addEventListener("click", (event) => {
  // 计算鼠标归一化坐标
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;

  // 更新射线
  raycaster.setFromCamera(mouse, camera);

  // 检测与气泡的交互
  const meshes = bubbles
    .filter((b) => b.state !== BUBBLE_STATE.BURSTING)
    .map((b) => b.mesh);
  const intersects = raycaster.intersectObjects(meshes);

  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    const bubble = bubbles.find((b) => b.mesh === clickedMesh);
    if (bubble) {
      burstBubble(bubble);
    }
  }
});

// 窗口调整
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// 气泡不再需要物理运动，保持固定位置
// updateFloatingBehavior 函数已移除

// 液滴生成函数（写实气泡破裂效果）
function createDroplets(bubble, shrinkPosition) {
  const dropletCount = 5 + Math.floor(Math.random() * 4); // 5-8个液滴
  const droplets = [];

  for (let i = 0; i < dropletCount; i++) {
    // 创建小液滴（使用相同的彩虹色shader材质）
    const dropletSize = bubble.size * (0.08 + Math.random() * 0.04);
    const dropletGeometry = new THREE.SphereGeometry(dropletSize, 16, 16);
    const dropletMaterial = bubble.material.clone();
    const droplet = new THREE.Mesh(dropletGeometry, dropletMaterial);

    droplet.position.copy(shrinkPosition);
    droplet.scale.set(1, 1, 1); // 液滴使用标准缩放
    scene.add(droplet);

    // 径向散开速度
    const angle = (Math.PI * 2 * i) / dropletCount + Math.random() * 0.5;
    const speed = 0.15 + Math.random() * 0.15;

    droplets.push({
      mesh: droplet,
      velocity: new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed * 0.5, // Y方向初速度较小
        (Math.random() - 0.5) * 0.05
      ),
      rotation: new THREE.Vector3(
        Math.random() * 0.15,
        Math.random() * 0.15,
        Math.random() * 0.15
      ),
      startTime: performance.now(),
      duration: 350 + Math.random() * 150, // 350-500ms
    });
  }

  return droplets;
}

// 气泡破裂主函数
const burstEffects = [];

function burstBubble(bubble) {
  if (bubble.state === BUBBLE_STATE.BURSTING) return;

  bubble.state = BUBBLE_STATE.BURSTING;

  // 阶段 1：收缩动画
  const shrinkEffect = {
    bubble,
    phase: "shrinking",
    startTime: performance.now(),
    shrinkDuration: 120, // 120ms 快速收缩
    originalScale: bubble.mesh.scale.clone(),
    originalPosition: bubble.mesh.position.clone(),
  };

  burstEffects.push(shrinkEffect);
}

// 更新破裂效果（支持收缩+液滴两阶段动画）
function updateBurstEffects(currentTime) {
  for (let i = burstEffects.length - 1; i >= 0; i--) {
    const effect = burstEffects[i];

    if (effect.phase === "shrinking") {
      // 阶段 1：收缩动画
      const elapsed = currentTime - effect.startTime;
      const progress = Math.min(elapsed / effect.shrinkDuration, 1);

      // 缩放到接近 0（保持原始比例）
      const scale = 1 - progress * 0.95;
      effect.bubble.mesh.scale.copy(effect.originalScale).multiplyScalar(scale);

      // 淡出（但不完全透明，因为shader材质不支持opacity属性）
      // 使用缩放来模拟消失效果
      effect.bubble.mesh.visible = scale > 0.05;

      if (progress >= 1) {
        // 收缩完成，切换到液滴阶段
        effect.bubble.mesh.visible = false;
        const droplets = createDroplets(
          effect.bubble,
          effect.bubble.mesh.position
        );

        effect.phase = "droplets";
        effect.droplets = droplets;
        effect.dropletStartTime = currentTime;
      }
    } else if (effect.phase === "droplets") {
      // 阶段 2：液滴动画
      let allComplete = true;

      effect.droplets.forEach((droplet) => {
        const elapsed = currentTime - droplet.startTime;
        const progress = elapsed / droplet.duration;

        if (progress < 1) {
          allComplete = false;

          // 更新位置
          droplet.mesh.position.add(droplet.velocity);

          // 重力影响
          droplet.velocity.y -= 0.008;

          // 旋转动画
          droplet.mesh.rotation.x += droplet.rotation.x;
          droplet.mesh.rotation.y += droplet.rotation.y;
          droplet.mesh.rotation.z += droplet.rotation.z;

          // 淡出和缩小
          const fadeProgress = Math.pow(progress, 1.5);
          const fadeScale = 1 - fadeProgress * 0.7; // 缩小到 30%
          droplet.mesh.scale.setScalar(fadeScale);

          // 通过缩放控制"消失"效果
          droplet.mesh.visible = fadeScale > 0.1;
        } else {
          // 清理液滴
          scene.remove(droplet.mesh);
          droplet.mesh.geometry.dispose();
          droplet.mesh.material.dispose();
        }
      });

      // 所有液滴完成后，气泡不重生，直接移除破裂效果
      if (allComplete) {
        burstEffects.splice(i, 1);
      }
    }
  }
}

// 气泡破裂后不再重生
// respawnBubble 函数已移除

// 更新气泡形变
const updateBubble = (bubble, time) => {
  const { geometry, positionAttributeBase, speed, spikes, processing, offset } =
    bubble;
  const vector = new THREE.Vector3();

  // 使用每个气泡独立的 speed 控制动画速度
  const animTime = time * 0.00001 * speed + offset;

  const positionAttribute = geometry.getAttribute("position");

  for (let i = 0; i < positionAttributeBase.count; i++) {
    vector.fromBufferAttribute(positionAttributeBase, i);

    // 使用每个气泡独立的 spikes 控制形变细节
    const noise = simplex.noise3d(
      vector.x * spikes,
      vector.y * spikes,
      vector.z * spikes + animTime
    );

    // 使用每个气泡独立的 processing 控制形变幅度
    const ratio = noise * (0.05 * processing) + 0.98;
    vector.multiplyScalar(ratio);
    positionAttribute.setXYZ(i, vector.x, vector.y, vector.z);
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();
};

// 动画循环
const clock = new THREE.Clock();

const tick = () => {
  const deltaTime = clock.getDelta();
  const currentTime = performance.now();

  // 更新破裂效果
  updateBurstEffects(currentTime);

  // 更新所有气泡
  bubbles.forEach((bubble) => {
    // 只更新可见的气泡
    if (bubble.state !== BUBBLE_STATE.BURSTING) {
      // 更新形变动画（保持表面波动效果）
      updateBubble(bubble, currentTime);
      bubble.material.uniforms.uCameraPos.value = camera.position;

      // 气泡位置保持固定，不再需要物理漂浮行为
    }
  });

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
