import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

// 场景设置
const canvas = document.querySelector("#webgl");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0, 6);

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 轨道控制器
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 气泡数组
const bubbles = [];

// 加载 HDR 环境贴图
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  "/studio_small_08_1k.hdr",
  (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;

    // 黑色背景
    scene.background = new THREE.Color(0x000000);

    texture.dispose();
    pmremGenerator.dispose();

    createBubbles();
    console.log("✅ HDR 加载成功！");
  },
  (progress) => {
    console.log(
      "⏳ HDR 加载中...",
      Math.round((progress.loaded / progress.total) * 100) + "%"
    );
  },
  (error) => {
    console.error("❌ HDR 加载失败:", error);
  }
);

// 创建写实气泡
function createBubbles() {
  const bubbleConfigs = [
    { size: 0.8, position: [-2, 0.5, 0] },
    { size: 1.2, position: [0, 0, 0] },
    { size: 1.0, position: [2, -0.3, 0] },
    { size: 0.6, position: [-1, -1, 0.5] },
    { size: 0.9, position: [1.5, 1, -0.5] },
  ];

  bubbleConfigs.forEach((config) => {
    const geometry = new THREE.SphereGeometry(config.size, 64, 64);

    // 写实气泡材质（参考图效果 - 强烈彩虹色边缘）
    const material = new THREE.MeshPhysicalMaterial({
      // 薄膜干涉（彩虹色）- 增强
      iridescence: 1.0,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [0, 800], // 更大范围 → 更丰富的彩虹色

      // 透明和折射 - 保持透明但增加可见度
      transmission: 0.9, // 略微降低透明度
      thickness: 0.5, // 增加厚度感
      ior: 1.33,

      // 高光和涂层 - 增强
      clearcoat: 1.0,
      clearcoatRoughness: 0,

      // 整体设置 - 增强可见度
      roughness: 0,
      metalness: 0,
      envMapIntensity: 3.5, // 大幅增强环境反射
      transparent: true,
      opacity: 0.4, // 大幅提高不透明度（0.05 → 0.4）
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...config.position);
    scene.add(mesh);

    bubbles.push({ mesh, material });
  });
}

// 动画循环
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

// 窗口调整
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
