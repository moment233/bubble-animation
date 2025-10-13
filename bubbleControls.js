import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise";
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

// 创建单个气泡
const simplex = new SimplexNoise();

// 默认配置
const config = {
  pos: [-15, 12, 0],
  size: 4,
  scale: [1.2, 0.85, 1.0],
  speed: 24,
  spikes: 0.26,
  processing: 0.72,
  offset: 3.5,
};

let geometry = new THREE.SphereGeometry(config.size, 64, 64);
let positionAttributeBase = geometry.getAttribute("position").clone();

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
mesh.scale.set(...config.scale);
scene.add(mesh);

const bubble = {
  mesh,
  geometry,
  material,
  positionAttributeBase,
  speed: config.speed,
  spikes: config.spikes,
  processing: config.processing,
  offset: config.offset,
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

// 更新气泡形变
const updateBubble = (bubble, time) => {
  const { geometry, positionAttributeBase, speed, spikes, processing, offset } =
    bubble;
  const vector = new THREE.Vector3();

  const animTime = time * 0.00001 * speed + offset;

  const positionAttribute = geometry.getAttribute("position");

  for (let i = 0; i < positionAttributeBase.count; i++) {
    vector.fromBufferAttribute(positionAttributeBase, i);

    const noise = simplex.noise3d(
      vector.x * spikes,
      vector.y * spikes,
      vector.z * spikes + animTime
    );

    const ratio = noise * (0.05 * processing) + 0.98;
    vector.multiplyScalar(ratio);
    positionAttribute.setXYZ(i, vector.x, vector.y, vector.z);
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();
};

// 控制器
const controls = {
  size: document.getElementById("size"),
  scaleX: document.getElementById("scaleX"),
  scaleY: document.getElementById("scaleY"),
  speed: document.getElementById("speed"),
  spikes: document.getElementById("spikes"),
  processing: document.getElementById("processing"),
  posX: document.getElementById("posX"),
  posY: document.getElementById("posY"),
};

const valueDisplays = {
  size: document.getElementById("sizeValue"),
  scaleX: document.getElementById("scaleXValue"),
  scaleY: document.getElementById("scaleYValue"),
  speed: document.getElementById("speedValue"),
  spikes: document.getElementById("spikesValue"),
  processing: document.getElementById("processingValue"),
  posX: document.getElementById("posXValue"),
  posY: document.getElementById("posYValue"),
};

// 更新几何体
function updateGeometry(newSize) {
  scene.remove(mesh);
  geometry.dispose();

  geometry = new THREE.SphereGeometry(newSize, 64, 64);
  positionAttributeBase = geometry.getAttribute("position").clone();

  mesh.geometry = geometry;
  bubble.geometry = geometry;
  bubble.positionAttributeBase = positionAttributeBase;

  scene.add(mesh);
}

// 监听控制器变化
controls.size.addEventListener("input", (e) => {
  const value = parseFloat(e.target.value);
  valueDisplays.size.textContent = value.toFixed(1);
  updateGeometry(value);
});

controls.scaleX.addEventListener("input", (e) => {
  const value = parseFloat(e.target.value);
  valueDisplays.scaleX.textContent = value.toFixed(2);
  mesh.scale.x = value;
});

controls.scaleY.addEventListener("input", (e) => {
  const value = parseFloat(e.target.value);
  valueDisplays.scaleY.textContent = value.toFixed(2);
  mesh.scale.y = value;
});

controls.speed.addEventListener("input", (e) => {
  const value = parseFloat(e.target.value);
  valueDisplays.speed.textContent = value;
  bubble.speed = value;
});

controls.spikes.addEventListener("input", (e) => {
  const value = parseFloat(e.target.value);
  valueDisplays.spikes.textContent = value.toFixed(2);
  bubble.spikes = value;
});

controls.processing.addEventListener("input", (e) => {
  const value = parseFloat(e.target.value);
  valueDisplays.processing.textContent = value.toFixed(2);
  bubble.processing = value;
});

controls.posX.addEventListener("input", (e) => {
  const value = parseFloat(e.target.value);
  valueDisplays.posX.textContent = value.toFixed(1);
  mesh.position.x = value;
});

controls.posY.addEventListener("input", (e) => {
  const value = parseFloat(e.target.value);
  valueDisplays.posY.textContent = value.toFixed(1);
  mesh.position.y = value;
});

// 重置按钮
document.getElementById("reset").addEventListener("click", () => {
  controls.size.value = 4;
  controls.scaleX.value = 1.2;
  controls.scaleY.value = 0.85;
  controls.speed.value = 24;
  controls.spikes.value = 0.26;
  controls.processing.value = 0.72;
  controls.posX.value = -15;
  controls.posY.value = 12;

  // 触发更新
  controls.size.dispatchEvent(new Event("input"));
  controls.scaleX.dispatchEvent(new Event("input"));
  controls.scaleY.dispatchEvent(new Event("input"));
  controls.speed.dispatchEvent(new Event("input"));
  controls.spikes.dispatchEvent(new Event("input"));
  controls.processing.dispatchEvent(new Event("input"));
  controls.posX.dispatchEvent(new Event("input"));
  controls.posY.dispatchEvent(new Event("input"));
});

// 复制配置代码
document.getElementById("copy").addEventListener("click", () => {
  const code = `{
  pos: [${controls.posX.value}, ${controls.posY.value}, 0],
  size: ${controls.size.value},
  scale: [${controls.scaleX.value}, ${controls.scaleY.value}, 1.0],
  speed: ${controls.speed.value},
  spikes: ${controls.spikes.value},
  processing: ${controls.processing.value},
  offset: 3.5,
}`;

  navigator.clipboard.writeText(code).then(() => {
    alert("✅ 配置代码已复制到剪贴板！");
  });
});

// 动画循环
const tick = () => {
  const time = performance.now();

  updateBubble(bubble, time);
  bubble.material.uniforms.uCameraPos.value = camera.position;

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
