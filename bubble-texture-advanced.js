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
camera.position.set(0, 0, 10);

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

// 存储三个球体
let opaqueSphere = null;     // 左：不透明纹理球体
let physicalSphere = null;   // 中：纯物理材质球体
let hybridSphere = null;     // 右：混合方案球体

// 加载 HDR 环境贴图
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  "/little_paris_eiffel_tower_1k.hdr",
  (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    scene.background = new THREE.Color(0x0a0a0a);

    texture.dispose();
    pmremGenerator.dispose();

    createSpheres();
    setupControls();
    console.log("✅ 场景创建成功！");
  },
  undefined,
  (error) => {
    console.error("❌ HDR 加载失败:", error);
    createSpheres();
    setupControls();
  }
);

// 创建三个对比球体
function createSpheres() {
  const sphereSize = 1.8;
  const separation = 4.5;

  // ========== 左侧：纯图片纹理（不透明）==========
  const opaqueGeometry = new THREE.SphereGeometry(sphereSize, 64, 64);
  const opaqueMaterial = new THREE.MeshStandardMaterial({
    color: 0x4fc3f7, // 默认蓝色，等待上传图片
    metalness: 0.3,
    roughness: 0.4,
    envMapIntensity: 1.0,
  });

  opaqueSphere = new THREE.Mesh(opaqueGeometry, opaqueMaterial);
  opaqueSphere.position.x = -separation;
  scene.add(opaqueSphere);

  // ========== 中间：纯物理材质（透明+彩虹）==========
  const physicalGeometry = new THREE.SphereGeometry(sphereSize, 64, 64);
  const physicalMaterial = new THREE.MeshPhysicalMaterial({
    // 薄膜干涉（彩虹色）
    iridescence: 1.0,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [0, 800],

    // 透明和折射
    transmission: 0.95,
    thickness: 0.5,
    ior: 1.33,

    // 高光和涂层
    clearcoat: 1.0,
    clearcoatRoughness: 0,

    // 整体设置
    roughness: 0,
    metalness: 0,
    envMapIntensity: 3.5,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  physicalSphere = new THREE.Mesh(physicalGeometry, physicalMaterial);
  physicalSphere.position.x = 0;
  scene.add(physicalSphere);

  // ========== 右侧：混合方案（透明+彩虹+图片纹理）⭐ ==========
  const hybridGeometry = new THREE.SphereGeometry(sphereSize, 64, 64);
  const hybridMaterial = new THREE.MeshPhysicalMaterial({
    // 保持透明和折射特性
    transmission: 0.95,
    thickness: 0.5,
    ior: 1.33,

    // 保持彩虹效果
    iridescence: 1.0,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [0, 800],

    // 高光和涂层
    clearcoat: 1.0,
    clearcoatRoughness: 0,

    // 整体设置
    roughness: 0,
    metalness: 0,
    envMapIntensity: 3.5,
    
    // 🔑 关键：使用 emissive（发光）来显示图片纹理
    // 图片会作为"发光"效果叠加在透明球体上
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.3, // 发光强度
    // emissiveMap 将在上传图片后设置

    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  hybridSphere = new THREE.Mesh(hybridGeometry, hybridMaterial);
  hybridSphere.position.x = separation;
  scene.add(hybridSphere);

  // 添加标签
  addLabel("纯图片纹理\n不透明", -separation, -sphereSize - 1.2);
  addLabel("纯物理材质\n透明折射", 0, -sphereSize - 1.2);
  addLabel("混合方案 ⭐\n透明+图片", separation, -sphereSize - 1.2);

  console.log("✅ 三个球体创建完成");
}

// 添加文字标签
function addLabel(text, x, y) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 512;
  canvas.height = 256;

  context.fillStyle = "rgba(0, 0, 0, 0.8)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.font = "bold 36px Arial";
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";

  const lines = text.split("\n");
  lines.forEach((line, i) => {
    context.fillText(line, canvas.width / 2, canvas.height / 2 + (i - 0.5) * 50);
  });

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.position.set(x, y, 0);
  sprite.scale.set(3, 1.5, 1);
  scene.add(sprite);
}

// ========== 图片上传功能 ==========
const fileInput = document.getElementById("fileInput");
const fileNameDisplay = document.getElementById("fileName");

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  fileNameDisplay.textContent = `已选择: ${file.name}`;

  const fileName = file.name.toLowerCase();
  const isHDR = fileName.endsWith('.hdr');

  if (isHDR) {
    // HDR 格式
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      const blob = new Blob([arrayBuffer]);
      const url = URL.createObjectURL(blob);

      const rgbeLoader = new RGBELoader();
      rgbeLoader.load(
        url,
        (texture) => {
          console.log("✅ HDR 图片加载成功！");
          applyTexture(texture);
          URL.revokeObjectURL(url);
        },
        undefined,
        (error) => {
          console.error("❌ HDR 加载失败:", error);
          alert("HDR 文件加载失败");
          URL.revokeObjectURL(url);
        }
      );
    };
    reader.readAsArrayBuffer(file);
  } else {
    // 普通图片格式
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target.result;
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        imageUrl,
        (texture) => {
          console.log("✅ 图片加载成功！");
          applyTexture(texture);
        },
        undefined,
        (error) => {
          console.error("❌ 图片加载失败:", error);
          alert("图片加载失败");
        }
      );
    };
    reader.readAsDataURL(file);
  }
});

// 应用纹理到三个球体
function applyTexture(texture) {
  // 左侧：纯图片纹理（不透明）
  if (opaqueSphere) {
    const newMaterial = new THREE.MeshStandardMaterial({
      map: texture, // 直接使用纹理，球体会变不透明
      metalness: 0.3,
      roughness: 0.4,
      envMapIntensity: 1.0,
    });
    opaqueSphere.material.dispose();
    opaqueSphere.material = newMaterial;
  }

  // 中间：纯物理材质（不变，不应用图片）
  // physicalSphere 保持原样

  // 右侧：混合方案 ⭐
  if (hybridSphere) {
    const useEmissive = document.getElementById("useEmissiveMap").checked;
    
    if (useEmissive) {
      // 🔑 方案1：使用 emissiveMap（图片作为"发光"效果）
      hybridSphere.material.emissiveMap = texture;
      hybridSphere.material.emissiveIntensity = parseFloat(
        document.getElementById("emissiveIntensity").value
      );
      console.log("✅ 混合方案：使用 emissiveMap（图片发光）");
    } else {
      // 方案2：使用 map（会降低透明度）
      hybridSphere.material.map = texture;
      console.log("✅ 混合方案：使用 map（会影响透明度）");
    }
    
    hybridSphere.material.needsUpdate = true;
  }

  console.log("✅ 纹理已应用到所有球体！");
}

// ========== 控制面板 ==========
function setupControls() {
  // 透明度控制
  const transmissionSlider = document.getElementById("transmission");
  const transmissionValue = document.getElementById("transmissionValue");
  transmissionSlider.addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);
    transmissionValue.textContent = value.toFixed(2);
    if (hybridSphere) {
      hybridSphere.material.transmission = value;
    }
  });

  // 彩虹强度控制
  const iridescenceSlider = document.getElementById("iridescence");
  const iridescenceValue = document.getElementById("iridescenceValue");
  iridescenceSlider.addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);
    iridescenceValue.textContent = value.toFixed(2);
    if (hybridSphere) {
      hybridSphere.material.iridescence = value;
    }
  });

  // 发光强度控制
  const emissiveSlider = document.getElementById("emissiveIntensity");
  const emissiveValue = document.getElementById("emissiveValue");
  emissiveSlider.addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);
    emissiveValue.textContent = value.toFixed(1);
    if (hybridSphere) {
      hybridSphere.material.emissiveIntensity = value;
    }
  });

  // 发光贴图开关
  const useEmissiveCheckbox = document.getElementById("useEmissiveMap");
  useEmissiveCheckbox.addEventListener("change", (e) => {
    if (hybridSphere && hybridSphere.material.emissiveMap) {
      const currentTexture = hybridSphere.material.emissiveMap || hybridSphere.material.map;
      
      if (e.target.checked) {
        // 切换到 emissiveMap
        hybridSphere.material.map = null;
        hybridSphere.material.emissiveMap = currentTexture;
        console.log("切换到 emissiveMap 模式");
      } else {
        // 切换到 map
        hybridSphere.material.emissiveMap = null;
        hybridSphere.material.map = currentTexture;
        console.log("切换到 map 模式");
      }
      
      hybridSphere.material.needsUpdate = true;
    }
  });
}

// 动画循环
function animate() {
  requestAnimationFrame(animate);

  // 缓慢旋转所有球体
  const rotationSpeed = 0.003;
  if (opaqueSphere) opaqueSphere.rotation.y += rotationSpeed;
  if (physicalSphere) physicalSphere.rotation.y += rotationSpeed;
  if (hybridSphere) hybridSphere.rotation.y += rotationSpeed;

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

