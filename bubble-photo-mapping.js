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

// 存储三种方案的对象
let billboardSprite = null;  // 方案1：Billboard（永远面向相机）
let uvSphere = null;          // 方案2：UV球体贴图（会有扭曲）
let inspiredSphere = null;    // 方案3：颜色参考的物理材质球体

// 加载 HDR 环境贴图
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  "/little_paris_eiffel_tower_1k.hdr",
  (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    scene.background = new THREE.Color(0x000000);

    texture.dispose();
    pmremGenerator.dispose();

    createScenes();
    setupControls();
    console.log("✅ 场景创建成功！");
  },
  undefined,
  (error) => {
    console.error("❌ HDR 加载失败:", error);
    createScenes();
    setupControls();
  }
);

// 创建三种方案的对比
function createScenes() {
  const size = 2.5;
  const separation = 5;

  // ========== 方案1：Billboard（Sprite永远面向相机）==========
  // 使用占位纹理
  const placeholderCanvas = createPlaceholderCanvas("Billboard\n永远面向相机", "#667eea");
  const placeholderTexture = new THREE.CanvasTexture(placeholderCanvas);
  
  const billboardMaterial = new THREE.SpriteMaterial({
    map: placeholderTexture,
    transparent: true,
  });
  
  billboardSprite = new THREE.Sprite(billboardMaterial);
  billboardSprite.position.x = -separation;
  billboardSprite.scale.set(size, size, 1);
  scene.add(billboardSprite);

  // ========== 方案2：UV球体贴图（会有扭曲）==========
  const uvGeometry = new THREE.SphereGeometry(size / 2, 64, 64);
  const uvPlaceholderCanvas = createPlaceholderCanvas("UV 贴图\n会有扭曲", "#ff6b6b");
  const uvPlaceholderTexture = new THREE.CanvasTexture(uvPlaceholderCanvas);
  
  const uvMaterial = new THREE.MeshStandardMaterial({
    map: uvPlaceholderTexture,
    metalness: 0.1,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });
  
  uvSphere = new THREE.Mesh(uvGeometry, uvMaterial);
  uvSphere.position.x = 0;
  scene.add(uvSphere);

  // ========== 方案3：颜色参考的物理材质（最真实）==========
  const inspiredGeometry = new THREE.SphereGeometry(size / 2, 64, 64);
  
  // 默认使用经典气泡材质（上传图片后会提取颜色）
  const inspiredMaterial = new THREE.MeshPhysicalMaterial({
    // 薄膜干涉（彩虹色）
    iridescence: 1.0,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [100, 400],

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
    envMapIntensity: 3.0,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
    
    // 可以添加轻微的基础色
    color: new THREE.Color(0xffffff),
  });
  
  inspiredSphere = new THREE.Mesh(inspiredGeometry, inspiredMaterial);
  inspiredSphere.position.x = separation;
  scene.add(inspiredSphere);

  // 添加标签
  addLabel("方案1: Billboard\n(永远面向相机)", -separation, -size / 2 - 1.5, "#667eea");
  addLabel("方案2: UV贴图\n(会有扭曲)", 0, -size / 2 - 1.5, "#ff6b6b");
  addLabel("方案3: 颜色参考\n(3D重新渲染)", separation, -size / 2 - 1.5, "#4caf50");

  console.log("✅ 三种方案创建完成");
}

// 创建占位图
function createPlaceholderCanvas(text, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");

  // 渐变背景
  const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "#000000");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 512);

  // 文字
  context.font = "bold 36px Arial";
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowColor = "rgba(0, 0, 0, 0.8)";
  context.shadowBlur = 10;

  const lines = text.split("\n");
  lines.forEach((line, i) => {
    context.fillText(line, 256, 256 + (i - 0.5) * 50);
  });

  return canvas;
}

// 添加文字标签
function addLabel(text, x, y, color) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 512;
  canvas.height = 256;

  context.fillStyle = "rgba(0, 0, 0, 0.85)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // 添加彩色边框
  context.strokeStyle = color;
  context.lineWidth = 8;
  context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  context.font = "bold 32px Arial";
  context.fillStyle = color;
  context.textAlign = "center";
  context.textBaseline = "middle";

  const lines = text.split("\n");
  lines.forEach((line, i) => {
    context.fillText(line, canvas.width / 2, canvas.height / 2 + (i - 0.5) * 45);
  });

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.position.set(x, y, 0);
  sprite.scale.set(3.5, 1.75, 1);
  scene.add(sprite);
}

// ========== 图片上传功能 ==========
const fileInput = document.getElementById("fileInput");
const fileNameDisplay = document.getElementById("fileName");

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  fileNameDisplay.textContent = `已选择: ${file.name}`;

  const reader = new FileReader();
  reader.onload = (e) => {
    const imageUrl = e.target.result;
    
    // 创建临时 Image 对象来分析图片
    const img = new Image();
    img.onload = () => {
      console.log("✅ 图片加载成功，开始应用到三种方案...");
      
      // 加载为纹理
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(imageUrl, (texture) => {
        applyTextureToScenes(texture, img);
      });
    };
    img.src = imageUrl;
  };
  
  reader.readAsDataURL(file);
});

// 应用纹理到三种方案
function applyTextureToScenes(texture, imgElement) {
  // ========== 方案1：Billboard（Sprite）==========
  if (billboardSprite) {
    billboardSprite.material.map = texture;
    billboardSprite.material.needsUpdate = true;
    console.log("✅ 方案1 (Billboard)：图片已应用，永远面向相机");
  }

  // ========== 方案2：UV球体贴图 ==========
  if (uvSphere) {
    // 直接将照片贴到球体上
    const uvMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0.1,
      roughness: 0.3,
      side: THREE.DoubleSide,
      transparent: true, // 如果照片有透明通道
    });
    
    uvSphere.material.dispose();
    uvSphere.material = uvMaterial;
    console.log("✅ 方案2 (UV贴图)：图片已贴到球体，旋转会看到扭曲");
  }

  // ========== 方案3：提取照片颜色，生成物理材质 ==========
  if (inspiredSphere) {
    // 分析图片的主色调
    const dominantColors = analyzeBubbleColors(imgElement);
    console.log("📊 分析照片主色调:", dominantColors);
    
    // 使用提取的颜色更新物理材质
    const inspiredMaterial = new THREE.MeshPhysicalMaterial({
      // 保持物理特性
      transmission: 0.95,
      thickness: 0.8,
      ior: 1.33,
      
      // 彩虹效果（根据照片调整）
      iridescence: 1.0,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [dominantColors.iridescenceMin, dominantColors.iridescenceMax],
      
      clearcoat: 1.0,
      clearcoatRoughness: 0,
      roughness: 0,
      metalness: 0,
      envMapIntensity: 3.5,
      
      // 使用照片的主色调
      color: new THREE.Color(dominantColors.baseColor),
      
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    
    inspiredSphere.material.dispose();
    inspiredSphere.material = inspiredMaterial;
    console.log("✅ 方案3 (颜色参考)：提取照片配色，重新渲染真实3D气泡");
  }
}

// 分析气泡照片的颜色特征
function analyzeBubbleColors(imgElement) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  
  // 缩小尺寸加快分析
  canvas.width = 100;
  canvas.height = 100;
  ctx.drawImage(imgElement, 0, 0, 100, 100);
  
  const imageData = ctx.getImageData(0, 0, 100, 100);
  const data = imageData.data;
  
  let totalR = 0, totalG = 0, totalB = 0;
  let pixelCount = 0;
  let maxSaturation = 0;
  let brightestPixel = { r: 0, g: 0, b: 0 };
  
  // 采样中心区域（避免边缘黑色背景）
  for (let y = 25; y < 75; y++) {
    for (let x = 25; x < 75; x++) {
      const i = (y * 100 + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      totalR += r;
      totalG += g;
      totalB += b;
      pixelCount++;
      
      // 找最饱和的像素（彩虹色）
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      
      if (saturation > maxSaturation) {
        maxSaturation = saturation;
      }
      
      // 找最亮的像素
      const brightness = (r + g + b) / 3;
      const currentBrightness = (brightestPixel.r + brightestPixel.g + brightestPixel.b) / 3;
      if (brightness > currentBrightness) {
        brightestPixel = { r, g, b };
      }
    }
  }
  
  // 计算平均颜色
  const avgR = Math.round(totalR / pixelCount);
  const avgG = Math.round(totalG / pixelCount);
  const avgB = Math.round(totalB / pixelCount);
  
  // 将RGB转换为十六进制
  const baseColor = `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
  
  // 根据饱和度推测彩虹效果强度
  const iridescenceMin = maxSaturation > 0.3 ? 100 : 50;
  const iridescenceMax = maxSaturation > 0.5 ? 800 : 400;
  
  return {
    baseColor,
    iridescenceMin,
    iridescenceMax,
    saturation: maxSaturation,
  };
}

// ========== 控制面板 ==========
function setupControls() {
  const methodSelector = document.getElementById("mappingMethod");
  
  methodSelector.addEventListener("change", (e) => {
    const method = e.target.value;
    
    // 根据选择显示/隐藏不同的球体
    if (method === "all") {
      // 全部显示，恢复位置
      if (billboardSprite) {
        billboardSprite.visible = true;
        billboardSprite.position.x = -5;
      }
      if (uvSphere) {
        uvSphere.visible = true;
        uvSphere.position.x = 0;
      }
      if (inspiredSphere) {
        inspiredSphere.visible = true;
        inspiredSphere.position.x = 5;
      }
    } else if (method === "billboard") {
      if (billboardSprite) {
        billboardSprite.visible = true;
        billboardSprite.position.x = 0;
      }
      if (uvSphere) uvSphere.visible = false;
      if (inspiredSphere) inspiredSphere.visible = false;
    } else if (method === "uv") {
      if (billboardSprite) billboardSprite.visible = false;
      if (uvSphere) {
        uvSphere.visible = true;
        uvSphere.position.x = 0;
      }
      if (inspiredSphere) inspiredSphere.visible = false;
    } else if (method === "inspired") {
      if (billboardSprite) billboardSprite.visible = false;
      if (uvSphere) uvSphere.visible = false;
      if (inspiredSphere) {
        inspiredSphere.visible = true;
        inspiredSphere.position.x = 0;
      }
    }
  });
}

// 动画循环
function animate() {
  requestAnimationFrame(animate);

  // 缓慢旋转球体（Billboard不旋转）
  const rotationSpeed = 0.005;
  if (uvSphere && uvSphere.visible) {
    uvSphere.rotation.y += rotationSpeed;
  }
  if (inspiredSphere && inspiredSphere.visible) {
    inspiredSphere.rotation.y += rotationSpeed;
  }

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

