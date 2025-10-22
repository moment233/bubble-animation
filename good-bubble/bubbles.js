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

// 创建多个气泡
const bubbles = [];
const simplex = new SimplexNoise();

// 全局变量存储环境贴图
let envMapTexture = null;

// 加载 HDR 环境贴图
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  "/radial_ramp_01.hdr",
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

// Raycaster 用于点击检测
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// 气泡状态常量
const BUBBLE_STATE = {
  FLOATING: "floating",
  BURSTING: "bursting",
};

// Z轴深度范围常量
const Z_DEPTH_MIN = -15;
const Z_DEPTH_MAX = 15;

// 生成底部随机位置（带Z轴深度）
function generateBottomPosition() {
  const x = (Math.random() - 0.5) * 35; // -17.5 到 17.5
  const y = -20;
  const z = Z_DEPTH_MIN + Math.random() * (Z_DEPTH_MAX - Z_DEPTH_MIN); // -15 到 15
  return [x, y, z];
}

// 生成整个屏幕范围的随机位置（初始化时使用，带Z轴深度）
function generateScatteredPosition() {
  const x = (Math.random() - 0.5) * 35; // -17.5 到 17.5
  const y = -20 + Math.random() * 40; // -20 到 20 (整个屏幕高度)
  const z = Z_DEPTH_MIN + Math.random() * (Z_DEPTH_MAX - Z_DEPTH_MIN); // -15 到 15
  return [x, y, z];
}

// 计算基于Z轴深度的缩放系数（近大远小效果）
function calculateDepthScale(z) {
  // Z值从-15（远）到15（近）
  // 缩放系数从0.5（远处小）到1.5（近处大）
  const normalizedZ = (z - Z_DEPTH_MIN) / (Z_DEPTH_MAX - Z_DEPTH_MIN); // 0到1
  return 0.5 + normalizedZ * 1.0; // 0.5到1.5
}

// 计算气泡物理参数
function calculatePhysicsParams(size) {
  const k = 0.8 + Math.random() * 0.4; // 0.8-1.2
  return {
    terminalVelocity: k * Math.sqrt(size) * 0.04, // 大幅降低上升速度 (0.15 → 0.04)
    swayAmplitude: (0.5 + Math.random() * 1.5) * size * 0.6, // 减小摆动幅度
    swayFrequency: 0.3 / size, // 降低摆动频率 (0.5 → 0.3)
    verticalVelocity: 0, // 初始垂直速度
    // Z轴运动参数
    zSwayAmplitude: 2.0 + Math.random() * 3.0, // Z轴摆动幅度 2-5
    zSwayFrequency: 0.15 + Math.random() * 0.1, // Z轴摆动频率 0.15-0.25
  };
}

// 气泡配置：17个气泡
const bubblesConfig = [
  {
    size: 1.3,
    scale: [1.0, 1.0, 1.0],
    speed: 18,
    spikes: 0.65,
    processing: 2.6,
    offset: 0,
  },
  {
    size: 1.3,
    scale: [1.1, 0.95, 1.0],
    speed: 22,
    spikes: 0.7,
    processing: 2.8,
    offset: 1.5,
  },
  {
    size: 1.3,
    scale: [1.05, 1.05, 1.0],
    speed: 15,
    spikes: 0.6,
    processing: 2.5,
    offset: 3.0,
  },
  {
    size: 1.3,
    scale: [0.95, 1.15, 1.0],
    speed: 20,
    spikes: 0.75,
    processing: 3.0,
    offset: 4.5,
  },
  {
    size: 1.3,
    scale: [1.15, 0.9, 1.0],
    speed: 17,
    spikes: 0.68,
    processing: 2.7,
    offset: 6.0,
  },
  {
    size: 1.2,
    scale: [2.5, 1.4, 1.0],
    speed: 19,
    spikes: 0.7,
    processing: 2.9,
    offset: 2.0,
  },
  {
    size: 1.2,
    scale: [1.2, 2.3, 1.0],
    speed: 16,
    spikes: 0.65,
    processing: 2.7,
    offset: 3.5,
  },
  {
    size: 1.2,
    scale: [1.9, 1.9, 1.0],
    speed: 21,
    spikes: 0.72,
    processing: 2.8,
    offset: 5.0,
  },
  {
    size: 1.2,
    scale: [1.1, 2.5, 1.0],
    speed: 18,
    spikes: 0.78,
    processing: 3.1,
    offset: 1.0,
  },
  {
    size: 2.0,
    scale: [1.0, 1.0, 1.0],
    speed: 110,
    spikes: 1.8,
    processing: 0.35,
    offset: 2.5,
  },
  {
    size: 1.3,
    scale: [1.0, 1.0, 1.0],
    speed: 20,
    spikes: 0.6,
    processing: 2.5,
    offset: 4.0,
  },
  {
    size: 1.3,
    scale: [1.05, 1.05, 1.0],
    speed: 18,
    spikes: 0.7,
    processing: 2.8,
    offset: 5.5,
  },
  {
    size: 1.3,
    scale: [1.0, 1.0, 1.0],
    speed: 22,
    spikes: 0.65,
    processing: 2.6,
    offset: 0.5,
  },
  {
    size: 1.3,
    scale: [1.0, 1.0, 1.0],
    speed: 16,
    spikes: 0.75,
    processing: 3.0,
    offset: 2.0,
  },
  {
    size: 1.3,
    scale: [1.2, 0.85, 1.0],
    speed: 24,
    spikes: 0.8,
    processing: 2.2,
    offset: 3.5,
  },
  // 添加完全球体气泡（不形变）
  {
    size: 1.5,
    scale: [1.0, 1.0, 1.0],
    speed: 0, // 不形变
    spikes: 0,
    processing: 0,
    offset: 0,
    isPerfectSphere: true, // 标记为完美球体
  },
  {
    size: 1.8,
    scale: [1.0, 1.0, 1.0],
    speed: 0,
    spikes: 0,
    processing: 0,
    offset: 0,
    isPerfectSphere: true,
  },
  {
    size: 1.2,
    scale: [1.0, 1.0, 1.0],
    speed: 0,
    spikes: 0,
    processing: 0,
    offset: 0,
    isPerfectSphere: true,
  },
];

// 创建气泡
bubblesConfig.forEach((config) => {
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

  // 初始化时在整个屏幕范围分散分布
  const startPos = generateScatteredPosition();
  mesh.position.set(...startPos);

  // 应用非均匀缩放 + 基于Z轴深度的缩放
  const depthScale = calculateDepthScale(startPos[2]);
  if (config.scale) {
    mesh.scale.set(
      config.scale[0] * depthScale,
      config.scale[1] * depthScale,
      config.scale[2] * depthScale
    );
  }

  scene.add(mesh);

  // 计算物理参数
  const physics = calculatePhysicsParams(config.size);

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
    isPerfectSphere: config.isPerfectSphere || false, // 是否为完美球体

    // 状态管理
    state: BUBBLE_STATE.FLOATING,

    // 物理参数
    terminalVelocity: physics.terminalVelocity,
    verticalVelocity: physics.verticalVelocity,
    swayAmplitude: physics.swayAmplitude,
    swayFrequency: physics.swayFrequency,
    baseX: startPos[0], // 摇摆中心点
    swayPhase: Math.random() * Math.PI * 2, // 随机初始相位

    // Z轴运动参数
    baseZ: startPos[2], // Z轴摇摆中心点
    zSwayPhase: Math.random() * Math.PI * 2, // Z轴随机初始相位
    zSwayAmplitude: physics.zSwayAmplitude,
    zSwayFrequency: physics.zSwayFrequency,

    // 噪声参数
    noiseOffset: Math.random() * 1000,

    // 边界限制
    bounds: {
      minX: -20,
      maxX: 20,
      maxY: 20, // 顶部边界
      minZ: Z_DEPTH_MIN, // Z轴最小值
      maxZ: Z_DEPTH_MAX, // Z轴最大值
    },
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

// 真实物理的漂浮行为更新
function updateFloatingBehavior(bubble, deltaTime, currentTime) {
  // 1. 向上运动（模拟浮力）
  // 逐渐加速到终端速度（模拟阻力）
  const damping = 0.03; // 降低阻尼系数，使加速更缓慢 (0.05 → 0.03)
  bubble.verticalVelocity +=
    (bubble.terminalVelocity - bubble.verticalVelocity) * damping;
  bubble.mesh.position.y += bubble.verticalVelocity * deltaTime * 30; // 大幅降低速度 (60 → 30)

  // 2. 之字形摇摆运动（X轴）
  bubble.swayPhase += bubble.swayFrequency * deltaTime * Math.PI; // 降低摆动速度 (2π → π)
  let swayOffset = Math.sin(bubble.swayPhase) * bubble.swayAmplitude;

  // 大气泡添加不规则运动（次级频率）
  if (bubble.size > 3.0) {
    swayOffset +=
      Math.sin(bubble.swayPhase * 1.7 + 1.2) * bubble.swayAmplitude * 0.3;
  }

  bubble.mesh.position.x = bubble.baseX + swayOffset;

  // 2.5. Z轴前后摇摆运动（景深动态效果）
  bubble.zSwayPhase += bubble.zSwayFrequency * deltaTime * Math.PI;
  let zSwayOffset = Math.sin(bubble.zSwayPhase) * bubble.zSwayAmplitude;

  bubble.mesh.position.z = bubble.baseZ + zSwayOffset;

  // 根据Z轴位置实时更新缩放（近大远小）
  const depthScale = calculateDepthScale(bubble.mesh.position.z);
  bubble.mesh.scale.set(
    bubble.baseScale[0] * depthScale,
    bubble.baseScale[1] * depthScale,
    bubble.baseScale[2] * depthScale
  );

  // 3. 添加湍流扰动（Perlin 噪声）- 降低强度
  const turbulenceX =
    simplex.noise3d(
      bubble.mesh.position.x * 0.1,
      currentTime * 0.0002, // 降低湍流变化速度 (0.0003 → 0.0002)
      bubble.noiseOffset
    ) * 0.01; // 降低扰动强度 (0.02 → 0.01)

  const turbulenceZ =
    simplex.noise3d(
      bubble.mesh.position.y * 0.1,
      currentTime * 0.0002,
      bubble.noiseOffset + 100
    ) * 0.005; // 降低扰动强度 (0.01 → 0.005)

  bubble.mesh.position.x += turbulenceX;
  bubble.mesh.position.z += turbulenceZ;

  // 4. X轴边界处理（穿透到对侧）
  if (bubble.mesh.position.x < bubble.bounds.minX) {
    bubble.mesh.position.x = bubble.bounds.maxX;
    bubble.baseX = bubble.bounds.maxX;
  } else if (bubble.mesh.position.x > bubble.bounds.maxX) {
    bubble.mesh.position.x = bubble.bounds.minX;
    bubble.baseX = bubble.bounds.minX;
  }

  // 4.5. Z轴边界处理（限制范围）
  if (bubble.mesh.position.z < bubble.bounds.minZ) {
    bubble.mesh.position.z = bubble.bounds.minZ;
    bubble.baseZ = bubble.bounds.minZ;
    bubble.zSwayPhase = Math.random() * Math.PI * 2; // 重置相位
  } else if (bubble.mesh.position.z > bubble.bounds.maxZ) {
    bubble.mesh.position.z = bubble.bounds.maxZ;
    bubble.baseZ = bubble.bounds.maxZ;
    bubble.zSwayPhase = Math.random() * Math.PI * 2; // 重置相位
  }

  // 5. 顶部边界处理
  if (bubble.mesh.position.y > bubble.bounds.maxY) {
    // 50% 概率自动破裂，50% 概率循环重生
    if (Math.random() < 0.5) {
      burstBubble(bubble);
    } else {
      respawnBubble(bubble);
    }
  }
}

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

      // 所有液滴完成后重生气泡
      if (allComplete) {
        respawnBubble(effect.bubble);
        burstEffects.splice(i, 1);
      }
    }
  }
}

// 气泡重生
function respawnBubble(bubble) {
  // 重置位置到底部随机位置（包含新的Z轴深度）
  const newPos = generateBottomPosition();
  bubble.mesh.position.set(...newPos);
  bubble.mesh.visible = true;

  // 计算基于新Z轴深度的缩放系数
  const depthScale = calculateDepthScale(newPos[2]);

  // 随机调整大小增加多样性
  if (!bubble.isPerfectSphere) {
    // 普通气泡：随机大小和缩放 + 深度缩放
    bubble.size = 1.2 + Math.random() * 2.0;
    const sizeVariation = 0.8 + Math.random() * 0.4;
    bubble.mesh.scale.set(
      bubble.baseScale[0] * sizeVariation * depthScale,
      bubble.baseScale[1] * sizeVariation * depthScale,
      bubble.baseScale[2] * depthScale
    );
  } else {
    // 完美球体：保持完美比例 + 深度缩放
    bubble.mesh.scale.set(depthScale, depthScale, depthScale);
  }

  // 重新计算物理参数
  const physics = calculatePhysicsParams(bubble.size);
  bubble.terminalVelocity = physics.terminalVelocity;
  bubble.verticalVelocity = 0;
  bubble.swayAmplitude = physics.swayAmplitude;
  bubble.swayFrequency = physics.swayFrequency;
  bubble.baseX = newPos[0];
  bubble.swayPhase = Math.random() * Math.PI * 2;

  // 重置Z轴参数
  bubble.baseZ = newPos[2];
  bubble.zSwayPhase = Math.random() * Math.PI * 2;
  bubble.zSwayAmplitude = physics.zSwayAmplitude;
  bubble.zSwayFrequency = physics.zSwayFrequency;

  // 重置状态
  bubble.state = BUBBLE_STATE.FLOATING;
}

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
      // 更新形变动画（完美球体跳过）
      if (!bubble.isPerfectSphere) {
        updateBubble(bubble, currentTime);
      }
      bubble.material.uniforms.uCameraPos.value = camera.position;

      // 更新物理漂浮行为
      if (bubble.state === BUBBLE_STATE.FLOATING) {
        updateFloatingBehavior(bubble, deltaTime, currentTime);
      }
    }
  });

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
