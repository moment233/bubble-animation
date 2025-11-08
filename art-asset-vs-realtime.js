import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

// 场景设置
const canvas = document.querySelector("#webgl");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0, 12);

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// 轨道控制器
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 存储三个球体
let directMapSphere = null;    // 方案1：直接贴图
let pbrMixSphere = null;       // 方案2：PBR 混合
let physicalSphere = null;     // 方案3：纯物理渲染

// 加载 HDR 环境贴图
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  "/little_paris_eiffel_tower_1k.hdr",
  (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;

    texture.dispose();
    pmremGenerator.dispose();

    createSpheres();
    setupLights();
    console.log("✅ 场景创建成功！");
  },
  undefined,
  (error) => {
    console.error("❌ HDR 加载失败:", error);
    createSpheres();
    setupLights();
  }
);

// 创建三个对比球体
function createSpheres() {
  const sphereSize = 2;
  const separation = 5;

  // 创建默认纹理（占位）
  const placeholderTexture = createPlaceholderTexture();

  // ========== 方案1：直接贴图（不透明）==========
  const directGeometry = new THREE.SphereGeometry(sphereSize, 64, 64);
  const directMaterial = new THREE.MeshStandardMaterial({
    map: placeholderTexture,
    metalness: 0.2,
    roughness: 0.4,
    envMapIntensity: 1.0,
    // 注意：这里没有 transmission，所以不透明
  });

  directMapSphere = new THREE.Mesh(directGeometry, directMaterial);
  directMapSphere.position.x = -separation;
  scene.add(directMapSphere);

  // ========== 方案2：PBR 混合（贴图 + 透明）==========
  const pbrGeometry = new THREE.SphereGeometry(sphereSize, 64, 64);
  const pbrMaterial = new THREE.MeshPhysicalMaterial({
    // 保持透明和折射
    transmission: 0.9,
    thickness: 0.5,
    ior: 1.33,
    
    // 轻微的彩虹效果
    iridescence: 0.5,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [100, 400],
    
    // 高光
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    
    // 贴图作为"发光"或"色彩参考"
    emissiveMap: placeholderTexture, // 图片作为发光效果
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.2,
    
    roughness: 0.1,
    metalness: 0,
    envMapIntensity: 2.5,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  pbrMixSphere = new THREE.Mesh(pbrGeometry, pbrMaterial);
  pbrMixSphere.position.x = 0;
  scene.add(pbrMixSphere);

  // ========== 方案3：纯物理渲染（最真实）==========
  const physicalGeometry = new THREE.SphereGeometry(sphereSize, 64, 64);
  const physicalMaterial = new THREE.MeshPhysicalMaterial({
    // 薄膜干涉（彩虹色）
    iridescence: 1.0,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [100, 800],

    // 透明和折射
    transmission: 0.95,
    thickness: 0.8,
    ior: 1.33,

    // 高光和涂层
    clearcoat: 1.0,
    clearcoatRoughness: 0,

    // 整体设置
    roughness: 0,
    metalness: 0,
    envMapIntensity: 3.5,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
    
    // 轻微的基础色（可选）
    color: new THREE.Color(0xffffff),
  });

  physicalSphere = new THREE.Mesh(physicalGeometry, physicalMaterial);
  physicalSphere.position.x = separation;
  scene.add(physicalSphere);

  // 添加标签
  addLabel("方案1: 直接贴图\n不透明、假", -separation, -sphereSize - 1.5, "#f44336");
  addLabel("方案2: PBR混合\n半透明、可控", 0, -sphereSize - 1.5, "#ff9800");
  addLabel("方案3: 物理渲染\n完全透明、真实", separation, -sphereSize - 1.5, "#4caf50");

  console.log("✅ 三个方案球体创建完成");
}

// 创建占位纹理
function createPlaceholderTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // 模拟气泡的径向渐变
  const gradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 256);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(0.2, 'rgba(255, 200, 255, 0.7)');
  gradient.addColorStop(0.4, 'rgba(200, 150, 255, 0.5)');
  gradient.addColorStop(0.6, 'rgba(150, 200, 255, 0.4)');
  gradient.addColorStop(0.8, 'rgba(100, 255, 200, 0.3)');
  gradient.addColorStop(1, 'rgba(100, 150, 255, 0.1)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  // 添加高光
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(350, 150, 60, 0, Math.PI * 2);
  ctx.fill();
  
  // 添加一些彩色斑点
  const colors = ['rgba(255, 100, 150, 0.3)', 'rgba(100, 200, 255, 0.3)', 'rgba(150, 255, 100, 0.3)'];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(
      Math.random() * 512,
      Math.random() * 512,
      Math.random() * 30 + 20,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  
  return new THREE.CanvasTexture(canvas);
}

// 添加标签
function addLabel(text, x, y, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, 512, 256);
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 506, 250);
  
  ctx.font = 'bold 32px Arial';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    ctx.fillText(line, 256, 128 + (i - 0.5) * 45);
  });
  
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true })
  );
  sprite.position.set(x, y, 0);
  sprite.scale.set(3.5, 1.75, 1);
  scene.add(sprite);
}

// 添加灯光
function setupLights() {
  // 主光源
  const mainLight = new THREE.DirectionalLight(0xffffff, 1);
  mainLight.position.set(5, 5, 5);
  scene.add(mainLight);
  
  // 补光
  const fillLight = new THREE.DirectionalLight(0x8899ff, 0.3);
  fillLight.position.set(-5, 3, -5);
  scene.add(fillLight);
  
  // 环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  
  // 点光源（模拟高光）
  const pointLight = new THREE.PointLight(0xffffff, 1, 20);
  pointLight.position.set(0, 5, 5);
  scene.add(pointLight);
}

// ========== 图片上传 ==========
const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('fileName');

fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  fileNameDisplay.textContent = `已选择: ${file.name}`;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(e.target.result, (texture) => {
      console.log('✅ 美术资源加载成功，应用到三个方案...');
      
      // 方案1：直接作为 map（不透明）
      if (directMapSphere) {
        directMapSphere.material.map = texture;
        directMapSphere.material.needsUpdate = true;
        console.log('  → 方案1: 直接贴图应用完成（会变成不透明球）');
      }
      
      // 方案2：作为 emissiveMap（半透明）
      if (pbrMixSphere) {
        pbrMixSphere.material.emissiveMap = texture;
        pbrMixSphere.material.needsUpdate = true;
        console.log('  → 方案2: PBR混合应用完成（保持透明，图片作为发光）');
      }
      
      // 方案3：提取颜色信息，不直接贴图
      if (physicalSphere) {
        // 创建临时Image来分析
        const img = new Image();
        img.onload = () => {
          const dominantColor = extractDominantColor(img);
          physicalSphere.material.color.setHex(dominantColor);
          console.log(`  → 方案3: 提取主色调 #${dominantColor.toString(16)}，应用到物理材质`);
        };
        img.src = e.target.result;
      }
    });
  };
  reader.readAsDataURL(file);
});

// 提取图片主色调
function extractDominantColor(img) {
  const canvas = document.createElement('canvas');
  canvas.width = 50;
  canvas.height = 50;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, 50, 50);
  
  const imageData = ctx.getImageData(0, 0, 50, 50);
  const data = imageData.data;
  
  let r = 0, g = 0, b = 0, count = 0;
  
  // 只采样中心区域
  for (let y = 15; y < 35; y++) {
    for (let x = 15; x < 35; x++) {
      const i = (y * 50 + x) * 4;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
  }
  
  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);
  
  return (r << 16) | (g << 8) | b;
}

// ========== 动画循环 ==========
let time = 0;

function animate() {
  requestAnimationFrame(animate);
  
  time += 0.01;
  
  // 缓慢旋转所有球体
  const rotationSpeed = 0.003;
  if (directMapSphere) directMapSphere.rotation.y += rotationSpeed;
  if (pbrMixSphere) pbrMixSphere.rotation.y += rotationSpeed;
  if (physicalSphere) physicalSphere.rotation.y += rotationSpeed;
  
  // 轻微的上下浮动
  const floatAmount = Math.sin(time) * 0.2;
  if (directMapSphere) directMapSphere.position.y = floatAmount;
  if (pbrMixSphere) pbrMixSphere.position.y = floatAmount;
  if (physicalSphere) physicalSphere.position.y = floatAmount;
  
  controls.update();
  renderer.render(scene, camera);
}

animate();

// 窗口调整
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// 输出调试信息
console.log('🎯 三种方案对比说明:');
console.log('');
console.log('方案1（左）: 直接贴图');
console.log('  - 就像给球体"涂"了一层颜料');
console.log('  - 图片会完整显示，但球体变成不透明的');
console.log('  - 失去了气泡的透明感和折射效果');
console.log('  - 高光和彩虹色固定，不会随视角变化');
console.log('');
console.log('方案2（中）: PBR混合');
console.log('  - 图片作为"发光"效果叠加在透明材质上');
console.log('  - 保持了一定的透明度和折射');
console.log('  - 可以控制图片的影响程度（emissiveIntensity）');
console.log('  - 折中方案，效果中等');
console.log('');
console.log('方案3（右）: 纯物理渲染');
console.log('  - 不直接使用图片，只提取颜色参考');
console.log('  - 完全透明、折射、彩虹效果都是实时计算的');
console.log('  - 最真实，但无法精确控制外观');
console.log('  - 这就是您图片中那种气泡的真实实现方式');
console.log('');
console.log('💡 结论: 如果需求侧喜欢那种透明的、有彩虹的真实气泡，');
console.log('   方案1（直接贴图）达不到效果！');
console.log('   需要用方案3（物理渲染）或方案2（PBR混合）。');

