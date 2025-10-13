import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
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
  60, // 增加视野角度 45→60
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.z = 30; // 拉远相机 25→30

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

// 气泡配置：17个气泡，增大间距布局
const bubblesConfig = [
  // 第一行 - 复杂波浪纹理气泡（下移）
  {
    pos: [-16, 0, 0], // Y: 4→0（下移4单位）
    size: 1.3,
    scale: [1.0, 1.0, 1.0],
    speed: 18,
    spikes: 0.65,
    processing: 2.6,
    offset: 0,
  },
  {
    pos: [-8, 0, 0],
    size: 1.3,
    scale: [1.1, 0.95, 1.0],
    speed: 22,
    spikes: 0.7,
    processing: 2.8,
    offset: 1.5,
  },
  {
    pos: [0, 0, 0],
    size: 1.3,
    scale: [1.05, 1.05, 1.0],
    speed: 15,
    spikes: 0.6,
    processing: 2.5,
    offset: 3.0,
  },
  {
    pos: [8, 0, 0],
    size: 1.3,
    scale: [0.95, 1.15, 1.0],
    speed: 20,
    spikes: 0.75,
    processing: 3.0,
    offset: 4.5,
  },
  {
    pos: [16, 0, 0],
    size: 1.3,
    scale: [1.15, 0.9, 1.0],
    speed: 17,
    spikes: 0.68,
    processing: 2.7,
    offset: 6.0,
  },

  // 第二行 - 扁平拉长形状（下移）
  {
    pos: [-16, -6, 0], // Y: -2→-6（下移4单位）
    size: 1.2,
    scale: [2.5, 1.4, 1.0],
    speed: 19,
    spikes: 0.7,
    processing: 2.9,
    offset: 2.0,
  },
  {
    pos: [-8, -6, 0],
    size: 1.2,
    scale: [1.2, 2.3, 1.0],
    speed: 16,
    spikes: 0.65,
    processing: 2.7,
    offset: 3.5,
  },
  {
    pos: [0, -6, 0],
    size: 1.2,
    scale: [1.9, 1.9, 1.0],
    speed: 21,
    spikes: 0.72,
    processing: 2.8,
    offset: 5.0,
  },
  {
    pos: [8, -6, 0],
    size: 1.2,
    scale: [1.1, 2.5, 1.0],
    speed: 18,
    spikes: 0.78,
    processing: 3.1,
    offset: 1.0,
  },
  {
    pos: [16, -6, 0],
    size: 2.0,
    speed: 110,
    spikes: 1.8,
    processing: 0.35,
    offset: 2.5,
  },

  // 第三行 - 复杂形变的气泡（下移）
  {
    pos: [-16, -12, 0], // Y: -8→-12（下移4单位）
    size: 1.3,
    scale: [1.0, 1.0, 1.0],
    speed: 20,
    spikes: 0.6,
    processing: 2.5,
    offset: 4.0,
  },
  {
    pos: [-8, -12, 0],
    size: 1.3,
    scale: [1.05, 1.05, 1.0],
    speed: 18,
    spikes: 0.7,
    processing: 2.8,
    offset: 5.5,
  },
  {
    pos: [0, -12, 0],
    size: 1.3,
    scale: [1.0, 1.0, 1.0],
    speed: 22,
    spikes: 0.65,
    processing: 2.6,
    offset: 0.5,
  },
  {
    pos: [8, -12, 0],
    size: 1.3,
    scale: [1.0, 1.0, 1.0],
    speed: 16,
    spikes: 0.75,
    processing: 3.0,
    offset: 2.0,
  },
  {
    pos: [16, -12, 0],
    size: 1.3,
    scale: [1.2, 0.85, 1.0],
    speed: 24,
    spikes: 0.8,
    processing: 2.2,
    offset: 3.5,
  },

  // 上半区：3个大气泡
  {
    pos: [-13.5, 9.5, 0], // Y: 8→9.5（继续向上移动1.5个单位≈50px）
    size: 5.4,
    scale: [1.4, 1.25, 1.0],
    speed: 113,
    spikes: 0.32,
    processing: 1,
    offset: 3.5,
  },
  {
    pos: [0, 9, 0], // 中间最大球（向下移动5单位）
    size: 4.5,
    scale: [1.0, 1.0, 1.0],
    speed: 12,
    spikes: 0.5,
    processing: 2.0,
    offset: 2.0,
  },
  {
    pos: [14, 14, 0],
    size: 6,
    scale: [1.4, 1.9, 1.0],
    speed: 79,
    spikes: 0.41,
    processing: 0.8,
    offset: 3.5,
  },
];

bubblesConfig.forEach((config, index) => {
  const geometry = new THREE.SphereGeometry(config.size, 64, 64);
  const positionAttributeBase = geometry.getAttribute("position").clone();

  const material = new THREE.ShaderMaterial({
    vertexShader: bubbleVertexShader,
    fragmentShader: bubbleFragmentShader,
    uniforms: {
      uCameraPos: { value: camera.position },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...config.pos);

  // 应用非均匀缩放（如果有 scale 参数）
  if (config.scale) {
    mesh.scale.set(...config.scale);
  }

  scene.add(mesh);

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
    // 为第一个气泡（index 15，即上半区第一个）添加左右飘动动画
    isFloating: index === 15,
    floatDirection: "horizontal", // 水平移动
    basePos: [...config.pos], // 保存初始位置
    floatSpeed: 0.3, // 飘动速度
    floatRadius: 6, // 飘动半径（6单位≈200px）
  });
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
  const elapsedTime = clock.getElapsedTime();
  const time = performance.now();

  // 更新所有气泡
  bubbles.forEach((bubble) => {
    updateBubble(bubble, time);
    bubble.material.uniforms.uCameraPos.value = camera.position;

    // 飘动动画（针对特定气泡）
    if (bubble.isFloating) {
      const t = elapsedTime * bubble.floatSpeed;
      const offset = Math.sin(t * 2) * bubble.floatRadius;

      if (bubble.floatDirection === "vertical") {
        // 上下往复移动
        bubble.mesh.position.x = bubble.basePos[0]; // X轴不动
        bubble.mesh.position.y = bubble.basePos[1] + offset;
        bubble.mesh.position.z = bubble.basePos[2]; // Z轴不动
      } else {
        // 左右往复移动（默认）
        bubble.mesh.position.x = bubble.basePos[0] + offset;
        bubble.mesh.position.y = bubble.basePos[1]; // Y轴不动
        bubble.mesh.position.z = bubble.basePos[2]; // Z轴不动
      }
    }

    // 自然变形动画（右上角气泡）
    if (bubble.isMorphing) {
      const t = elapsedTime * bubble.morphSpeed;
      // 使用不同频率的正弦波创造自然的、不规则的变形
      const scaleX =
        bubble.baseScale[0] * (1 + Math.sin(t * 1.3) * bubble.morphIntensity);
      const scaleY =
        bubble.baseScale[1] * (1 + Math.sin(t * 1.7) * bubble.morphIntensity);

      bubble.mesh.scale.set(scaleX, scaleY, bubble.baseScale[2]);
    }
  });

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
