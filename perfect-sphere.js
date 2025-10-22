import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

// 场景、相机、渲染器
const canvas = document.querySelector("#webgl");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0, 8);

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

// 全局变量
const spheres = [];

// PMREMGenerator 用于生成预过滤的环境贴图
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// 加载 HDR 环境贴图
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  "/studio_small_08_1k.hdr",
  (texture) => {
    // 生成 PMREM 环境贴图
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;

    // 场景使用 PMREM（MeshPhysicalMaterial 会自动使用它）
    scene.environment = envMap;

    // 使用模糊的环境作为背景（参考代码的设置）
    scene.background = envMap;
    scene.backgroundBlurriness = 1.0; // 背景模糊度（类似 blur={1}）

    // 释放资源
    texture.dispose();
    pmremGenerator.dispose();

    // 创建球体
    createSpheres();

    console.log("✅ HDR 环境贴图加载成功！使用 MeshPhysicalMaterial");
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

// 创建完美球体
function createSpheres() {
  const sphereConfigs = [
    { size: 1.0, position: [-2, 0, 0] },
    { size: 1.5, position: [0, 0, 0] },
    { size: 1.2, position: [2.5, 0, 0] },
  ];

  sphereConfigs.forEach((config) => {
    const geometry = new THREE.SphereGeometry(config.size, 64, 64);

    // 使用 MeshPhysicalMaterial（参考 React Three Fiber 的实现）
    const material = new THREE.MeshPhysicalMaterial({
      transmission: 1.05, // 略大于 1（参考代码的设置）
      thickness: -0.5, // 负值！（参考代码的关键设置）
      roughness: 0, // 完全光滑
      metalness: 0, // 非金属
      clearcoat: 1, // 透明涂层
      clearcoatRoughness: 0, // 涂层光滑
      iridescence: 1, // 薄膜干涉（彩虹色）
      iridescenceIOR: 1, // 薄膜折射率
      iridescenceThicknessRange: [0, 1200], // 更大的范围（参考代码）
      envMapIntensity: 1.5, // 环境贴图强度
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...config.position);
    scene.add(mesh);

    spheres.push({ mesh, material });
  });
}

// 动画循环
function animate() {
  requestAnimationFrame(animate);

  // 更新轨道控制器
  controls.update();

  // MeshPhysicalMaterial 自动使用 scene.environment，无需手动更新

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
