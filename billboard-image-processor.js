import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// 场景设置
const canvas = document.querySelector("#webgl");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

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

// 存储原始图片和处理后的图片
let originalImage = null;
let originalSprite = null;
let processedSprite = null;
let processedTexture = null;

// 处理参数
const params = {
  removalMethod: 'none',
  chromaTolerance: 0.3,
  feather: 5,
};

// 初始化
init();

function init() {
  createPlaceholderSprites();
  setupControls();
  animate();
}

// 创建占位符
function createPlaceholderSprites() {
  const size = 3;
  
  // 左侧：原始图片
  const leftCanvas = createPlaceholderCanvas("原始图片\n上传后显示", "#667eea");
  const leftTexture = new THREE.CanvasTexture(leftCanvas);
  originalSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: leftTexture, transparent: true })
  );
  originalSprite.position.x = -3;
  originalSprite.scale.set(size, size, 1);
  scene.add(originalSprite);
  
  // 右侧：处理后图片
  const rightCanvas = createPlaceholderCanvas("处理后图片\n自动去背景", "#f093fb");
  const rightTexture = new THREE.CanvasTexture(rightCanvas);
  processedSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: rightTexture, transparent: true })
  );
  processedSprite.position.x = 3;
  processedSprite.scale.set(size, size, 1);
  scene.add(processedSprite);
  
  // 添加标签
  addLabel("原始图片", -3, -2.5, "#667eea");
  addLabel("处理后", 3, -2.5, "#f093fb");
  
  // 添加网格地板作为参考
  const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
  gridHelper.position.y = -3;
  scene.add(gridHelper);
}

// 创建占位图
function createPlaceholderCanvas(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // 渐变背景
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  // 文字
  ctx.font = 'bold 40px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 10;
  
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    ctx.fillText(line, 256, 256 + (i - 0.5) * 60);
  });
  
  return canvas;
}

// 添加标签
function addLabel(text, x, y, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, 512, 128);
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 506, 122);
  
  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);
  
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true })
  );
  sprite.position.set(x, y, 0);
  sprite.scale.set(2.5, 0.625, 1);
  scene.add(sprite);
}

// ========== 图片上传 ==========
const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('fileName');
const previewArea = document.getElementById('previewArea');
const previewCanvas = document.getElementById('previewCanvas');

fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  fileNameDisplay.textContent = `已选择: ${file.name}`;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      originalImage = img;
      
      // 显示预览
      previewArea.style.display = 'block';
      const ctx = previewCanvas.getContext('2d');
      const scale = Math.min(250 / img.width, 250 / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      previewCanvas.width = w;
      previewCanvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      
      // 更新左侧原始图片
      const originalTexture = new THREE.Texture(img);
      originalTexture.needsUpdate = true;
      originalSprite.material.map = originalTexture;
      originalSprite.material.needsUpdate = true;
      
      // 自动处理
      processImage();
      
      console.log('✅ 图片加载成功');
      console.log(`📐 尺寸: ${img.width} x ${img.height}`);
      
      // 分析图片特征
      analyzeImage(img);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// 分析图片特征
function analyzeImage(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // 检测背景色（四个角的颜色）
  const corners = [
    { x: 0, y: 0 },
    { x: canvas.width - 1, y: 0 },
    { x: 0, y: canvas.height - 1 },
    { x: canvas.width - 1, y: canvas.height - 1 },
  ];
  
  let darkCorners = 0;
  let lightCorners = 0;
  
  corners.forEach(corner => {
    const i = (corner.y * canvas.width + corner.x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    
    if (brightness < 50) darkCorners++;
    if (brightness > 200) lightCorners++;
  });
  
  console.log('📊 图片分析:');
  console.log(`  - 暗色角: ${darkCorners}/4`);
  console.log(`  - 亮色角: ${lightCorners}/4`);
  
  // 自动推荐处理方式
  if (darkCorners >= 3) {
    console.log('💡 建议: 使用"亮度抠图"去除暗色背景');
    document.getElementById('removalMethod').value = 'brightness';
    params.removalMethod = 'brightness';
  } else if (lightCorners >= 3) {
    console.log('💡 建议: 使用"亮度抠图"去除亮色背景');
    document.getElementById('removalMethod').value = 'brightness';
    params.removalMethod = 'brightness';
  } else {
    console.log('💡 建议: 使用"色度抠图"或"边缘检测"');
    document.getElementById('removalMethod').value = 'chroma';
    params.removalMethod = 'chroma';
  }
}

// ========== 图片处理 ==========
function processImage() {
  if (!originalImage) return;
  
  const canvas = document.createElement('canvas');
  canvas.width = originalImage.width;
  canvas.height = originalImage.height;
  const ctx = canvas.getContext('2d');
  
  // 绘制原始图片
  ctx.drawImage(originalImage, 0, 0);
  
  // 获取图像数据
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // 根据选择的方法处理
  if (params.removalMethod === 'chroma') {
    // 色度抠图（去除特定颜色）
    removeChromaKey(data, canvas);
  } else if (params.removalMethod === 'brightness') {
    // 亮度抠图
    removeBrightness(data, canvas);
  } else if (params.removalMethod === 'edge') {
    // 边缘检测抠图
    removeByEdgeDetection(data, canvas);
  }
  
  // 应用边缘羽化
  if (params.feather > 0) {
    applyFeathering(data, canvas.width, canvas.height, params.feather);
  }
  
  // 更新图像数据
  ctx.putImageData(imageData, 0, 0);
  
  // 更新右侧 Sprite
  if (processedTexture) {
    processedTexture.dispose();
  }
  processedTexture = new THREE.CanvasTexture(canvas);
  processedSprite.material.map = processedTexture;
  processedSprite.material.needsUpdate = true;
  
  console.log('✅ 图片处理完成');
}

// 色度抠图（去除背景色）
function removeChromaKey(data, canvas) {
  // 采样四个角，获取背景色
  const corners = [
    0, // 左上
    (canvas.width - 1) * 4, // 右上
    (canvas.height - 1) * canvas.width * 4, // 左下
    ((canvas.height - 1) * canvas.width + canvas.width - 1) * 4, // 右下
  ];
  
  let bgR = 0, bgG = 0, bgB = 0;
  corners.forEach(i => {
    bgR += data[i];
    bgG += data[i + 1];
    bgB += data[i + 2];
  });
  bgR /= corners.length;
  bgG /= corners.length;
  bgB /= corners.length;
  
  console.log(`🎨 检测到背景色: RGB(${Math.round(bgR)}, ${Math.round(bgG)}, ${Math.round(bgB)})`);
  
  // 遍历所有像素
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // 计算与背景色的距离
    const distance = Math.sqrt(
      Math.pow(r - bgR, 2) +
      Math.pow(g - bgG, 2) +
      Math.pow(b - bgB, 2)
    ) / 441.67; // 归一化到 0-1
    
    // 如果颜色接近背景色，设置为透明
    if (distance < params.chromaTolerance) {
      data[i + 3] = 0; // 完全透明
    } else if (distance < params.chromaTolerance + 0.2) {
      // 过渡区域，半透明
      const alpha = (distance - params.chromaTolerance) / 0.2;
      data[i + 3] = Math.round(alpha * 255);
    }
  }
}

// 亮度抠图
function removeBrightness(data, canvas) {
  // 计算平均亮度
  let totalBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    totalBrightness += (r + g + b) / 3;
  }
  const avgBrightness = totalBrightness / (data.length / 4);
  
  const isDarkBackground = avgBrightness < 128;
  console.log(`💡 背景类型: ${isDarkBackground ? '暗色' : '亮色'} (平均亮度: ${Math.round(avgBrightness)})`);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    
    if (isDarkBackground) {
      // 去除暗色背景
      if (brightness < 50) {
        data[i + 3] = 0;
      } else if (brightness < 100) {
        data[i + 3] = Math.round((brightness - 50) / 50 * 255);
      }
    } else {
      // 去除亮色背景
      if (brightness > 200) {
        data[i + 3] = 0;
      } else if (brightness > 150) {
        data[i + 3] = Math.round((200 - brightness) / 50 * 255);
      }
    }
  }
}

// 边缘检测抠图（简化版）
function removeByEdgeDetection(data, canvas) {
  const width = canvas.width;
  const height = canvas.height;
  
  // 创建副本用于边缘检测
  const copy = new Uint8ClampedArray(data);
  
  // 找到图像中心区域的平均亮度（假设中心是主体）
  let centerBrightness = 0;
  let centerCount = 0;
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const radius = Math.min(width, height) / 4;
  
  for (let y = centerY - radius; y < centerY + radius; y++) {
    for (let x = centerX - radius; x < centerX + radius; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const i = (y * width + x) * 4;
        centerBrightness += (copy[i] + copy[i + 1] + copy[i + 2]) / 3;
        centerCount++;
      }
    }
  }
  centerBrightness /= centerCount;
  
  // 根据与中心的差异设置透明度
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const brightness = (copy[i] + copy[i + 1] + copy[i + 2]) / 3;
      
      // 计算到中心的距离
      const dx = x - centerX;
      const dy = y - centerY;
      const distToCenter = Math.sqrt(dx * dx + dy * dy) / (width / 2);
      
      // 边缘和颜色差异大的区域变透明
      const brightnessDiff = Math.abs(brightness - centerBrightness) / 255;
      const alpha = 1 - Math.min(1, distToCenter * 0.5 + brightnessDiff);
      
      data[i + 3] = Math.round(alpha * 255);
    }
  }
}

// 边缘羽化
function applyFeathering(data, width, height, featherRadius) {
  const copy = new Uint8ClampedArray(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const originalAlpha = copy[i + 3];
      
      if (originalAlpha > 0 && originalAlpha < 255) {
        // 对半透明像素进行模糊
        let sumAlpha = 0;
        let count = 0;
        
        for (let dy = -featherRadius; dy <= featherRadius; dy++) {
          for (let dx = -featherRadius; dx <= featherRadius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const ni = (ny * width + nx) * 4;
              sumAlpha += copy[ni + 3];
              count++;
            }
          }
        }
        
        data[i + 3] = Math.round(sumAlpha / count);
      }
    }
  }
}

// ========== 控制面板 ==========
function setupControls() {
  // 处理方式选择
  document.getElementById('removalMethod').addEventListener('change', (e) => {
    params.removalMethod = e.target.value;
    if (originalImage) processImage();
  });
  
  // 色度容差
  const chromaTolerance = document.getElementById('chromaTolerance');
  chromaTolerance.addEventListener('input', (e) => {
    params.chromaTolerance = parseFloat(e.target.value);
    document.getElementById('chromaToleranceValue').textContent = params.chromaTolerance.toFixed(2);
    if (originalImage) processImage();
  });
  
  // 边缘羽化
  const feather = document.getElementById('feather');
  feather.addEventListener('input', (e) => {
    params.feather = parseInt(e.target.value);
    document.getElementById('featherValue').textContent = params.feather;
    if (originalImage) processImage();
  });
  
  // 应用处理按钮
  document.getElementById('processBtn').addEventListener('click', () => {
    if (originalImage) {
      processImage();
      console.log('🔄 重新处理图片');
    } else {
      alert('请先上传图片');
    }
  });
  
  // 重置按钮
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (originalImage) {
      params.removalMethod = 'none';
      document.getElementById('removalMethod').value = 'none';
      processImage();
      console.log('↺ 重置为原始图片');
    }
  });
}

// ========== 动画循环 ==========
function animate() {
  requestAnimationFrame(animate);
  
  controls.update();
  renderer.render(scene, camera);
}

// 窗口调整
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

