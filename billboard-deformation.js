import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// 场景设置
const canvas = document.querySelector("#webgl");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

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

// 存储三种形变方案
let shaderBillboard = null;    // 方案1：Shader 扭曲
let planeBillboard = null;     // 方案2：Plane + LookAt 形变
let particleSystem = null;     // 方案3：粒子云 Billboard

// 控制参数
const params = {
  waveAmplitude: 0.2,
  waveSpeed: 2.0,
  distortion: 0.1,
  subdivision: 32,
  particleCount: 100,
};

// 时间变量
let time = 0;

// 默认纹理
let currentTexture = null;

// 初始化
init();

function init() {
  // 创建默认纹理
  createDefaultTexture();
  
  // 创建三种方案
  createShaderBillboard();
  createPlaneBillboard();
  createParticleSystem();
  
  // 添加标签
  addLabels();
  
  // 设置控制面板
  setupControls();
  
  // 启动动画
  animate();
}

// ========== 方案1: Shader 扭曲的 Billboard ==========
function createShaderBillboard() {
  const size = 2.5;
  
  // 自定义 Shader Material
  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: currentTexture },
      uTime: { value: 0 },
      uWaveAmplitude: { value: params.waveAmplitude },
      uDistortion: { value: params.distortion },
    },
    vertexShader: `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform float uTime;
      uniform float uWaveAmplitude;
      uniform float uDistortion;
      
      varying vec2 vUv;
      
      void main() {
        // 从中心点计算距离
        vec2 center = vec2(0.5, 0.5);
        vec2 toCenter = vUv - center;
        float dist = length(toCenter);
        
        // 方法1: 波浪扭曲（涟漪效果）
        float wave = sin(dist * 10.0 - uTime * 3.0) * uWaveAmplitude * (1.0 - dist);
        vec2 distortedUV = vUv + toCenter * wave;
        
        // 方法2: 旋转扭曲
        float angle = uDistortion * sin(uTime * 2.0) * (1.0 - dist);
        float s = sin(angle);
        float c = cos(angle);
        vec2 rotated = vec2(
          toCenter.x * c - toCenter.y * s,
          toCenter.x * s + toCenter.y * c
        );
        distortedUV = center + rotated;
        
        // 方法3: 挤压拉伸（气泡被风吹的效果）
        float squeeze = 1.0 + sin(uTime * 2.0) * 0.2;
        vec2 squeezedUV = vec2(
          (distortedUV.x - 0.5) * squeeze + 0.5,
          (distortedUV.y - 0.5) / squeeze + 0.5
        );
        
        // 采样纹理
        vec4 color = texture2D(uTexture, squeezedUV);
        
        // 添加边缘柔化（气泡边缘透明）
        float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
        color.a *= alpha;
        
        gl_FragColor = color;
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  
  // 创建 Sprite（自动面向相机）
  // 注意：Sprite 不支持自定义 Shader，所以我们用 Plane + billboard 技术
  const geometry = new THREE.PlaneGeometry(size, size);
  shaderBillboard = new THREE.Mesh(geometry, shaderMaterial);
  shaderBillboard.position.x = -5;
  scene.add(shaderBillboard);
}

// ========== 方案2: Plane + LookAt + 顶点形变 ==========
function createPlaneBillboard() {
  const size = 2.5;
  
  // 创建高细分的平面
  const geometry = new THREE.PlaneGeometry(
    size, 
    size, 
    params.subdivision, 
    params.subdivision
  );
  
  // 自定义 Shader Material（顶点形变）
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: currentTexture },
      uTime: { value: 0 },
      uWaveAmplitude: { value: params.waveAmplitude },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uWaveAmplitude;
      
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        
        // 顶点位置
        vec3 pos = position;
        
        // 计算到中心的距离
        float dist = length(uv - 0.5);
        
        // 波浪形变（Z轴）
        float wave1 = sin(uv.x * 10.0 + uTime * 2.0) * uWaveAmplitude;
        float wave2 = cos(uv.y * 10.0 + uTime * 2.0) * uWaveAmplitude;
        
        // 只在气泡范围内形变（圆形mask）
        float mask = 1.0 - smoothstep(0.3, 0.5, dist);
        pos.z += (wave1 + wave2) * mask;
        
        // 凹凸效果（模拟气泡表面）
        float bump = sin(dist * 20.0 - uTime * 3.0) * 0.05;
        pos.z += bump * mask;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      
      varying vec2 vUv;
      
      void main() {
        vec2 center = vec2(0.5, 0.5);
        float dist = length(vUv - center);
        
        vec4 color = texture2D(uTexture, vUv);
        
        // 圆形遮罩（气泡形状）
        float alpha = 1.0 - smoothstep(0.45, 0.5, dist);
        color.a *= alpha;
        
        gl_FragColor = color;
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  
  planeBillboard = new THREE.Mesh(geometry, material);
  planeBillboard.position.x = 0;
  scene.add(planeBillboard);
}

// ========== 方案3: 粒子云 Billboard ==========
function createParticleSystem() {
  const particleCount = params.particleCount;
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const offsets = new Float32Array(particleCount); // 随机偏移
  
  // 在球体内随机分布粒子
  for (let i = 0; i < particleCount; i++) {
    // 球形分布
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = Math.pow(Math.random(), 1/3) * 1.2; // 立方根分布，更均匀
    
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta) + 5; // x + 5 偏移到右侧
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
    
    sizes[i] = Math.random() * 0.3 + 0.2;
    offsets[i] = Math.random() * Math.PI * 2; // 随机相位
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('offset', new THREE.BufferAttribute(offsets, 1));
  
  // 粒子 Shader
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: currentTexture },
      uTime: { value: 0 },
      uWaveAmplitude: { value: params.waveAmplitude },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uWaveAmplitude;
      
      attribute float size;
      attribute float offset;
      
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        
        // 获取粒子位置
        vec3 pos = position;
        
        // 波浪形变
        float wave = sin(length(pos.yz) * 5.0 + uTime * 2.0 + offset) * uWaveAmplitude;
        pos += normalize(pos - vec3(5.0, 0.0, 0.0)) * wave;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // 粒子大小（近大远小）
        gl_PointSize = size * 100.0 * (1.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      
      void main() {
        // 圆形粒子
        vec2 uv = gl_PointCoord;
        float dist = length(uv - 0.5);
        
        if (dist > 0.5) discard; // 圆形裁剪
        
        vec4 color = texture2D(uTexture, uv);
        
        // 边缘柔化
        float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
        color.a *= alpha * 0.8;
        
        gl_FragColor = color;
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  
  particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);
}

// ========== 创建默认纹理 ==========
function createDefaultTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // 径向渐变（气泡效果）
  const gradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 256);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(0.3, 'rgba(200, 180, 255, 0.7)');
  gradient.addColorStop(0.6, 'rgba(150, 200, 255, 0.5)');
  gradient.addColorStop(1, 'rgba(100, 150, 255, 0.2)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  // 添加高光
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.ellipse(350, 150, 80, 100, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  
  currentTexture = new THREE.CanvasTexture(canvas);
}

// ========== 添加标签 ==========
function addLabels() {
  const labels = [
    { text: "Shader 扭曲\nUV形变", x: -5, color: "#667eea" },
    { text: "Plane + LookAt\n顶点形变", x: 0, color: "#f093fb" },
    { text: "粒子云\n多 Billboard", x: 5, color: "#4facfe" },
  ];
  
  labels.forEach(label => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 512, 256);
    
    ctx.strokeStyle = label.color;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 506, 250);
    
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = label.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const lines = label.text.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, 256, 128 + (i - 0.5) * 45);
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texture, transparent: true })
    );
    sprite.position.set(label.x, -2.5, 0);
    sprite.scale.set(3, 1.5, 1);
    scene.add(sprite);
  });
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
      currentTexture = texture;
      
      // 更新所有方案的纹理
      if (shaderBillboard) {
        shaderBillboard.material.uniforms.uTexture.value = texture;
      }
      if (planeBillboard) {
        planeBillboard.material.uniforms.uTexture.value = texture;
      }
      if (particleSystem) {
        particleSystem.material.uniforms.uTexture.value = texture;
      }
      
      console.log('✅ 纹理已应用到所有方案');
    });
  };
  reader.readAsDataURL(file);
});

// ========== 控制面板 ==========
function setupControls() {
  // 形变方案选择
  document.getElementById('deformationType').addEventListener('change', (e) => {
    const type = e.target.value;
    
    if (type === 'all') {
      if (shaderBillboard) { shaderBillboard.visible = true; shaderBillboard.position.x = -5; }
      if (planeBillboard) { planeBillboard.visible = true; planeBillboard.position.x = 0; }
      if (particleSystem) { particleSystem.visible = true; }
    } else if (type === 'shader') {
      if (shaderBillboard) { shaderBillboard.visible = true; shaderBillboard.position.x = 0; }
      if (planeBillboard) planeBillboard.visible = false;
      if (particleSystem) particleSystem.visible = false;
    } else if (type === 'plane') {
      if (shaderBillboard) shaderBillboard.visible = false;
      if (planeBillboard) { planeBillboard.visible = true; planeBillboard.position.x = 0; }
      if (particleSystem) particleSystem.visible = false;
    } else if (type === 'particles') {
      if (shaderBillboard) shaderBillboard.visible = false;
      if (planeBillboard) planeBillboard.visible = false;
      if (particleSystem) { particleSystem.visible = true; }
    }
  });
  
  // 波浪强度
  const waveAmplitude = document.getElementById('waveAmplitude');
  waveAmplitude.addEventListener('input', (e) => {
    params.waveAmplitude = parseFloat(e.target.value);
    document.getElementById('waveAmplitudeValue').textContent = params.waveAmplitude.toFixed(2);
  });
  
  // 波浪速度
  const waveSpeed = document.getElementById('waveSpeed');
  waveSpeed.addEventListener('input', (e) => {
    params.waveSpeed = parseFloat(e.target.value);
    document.getElementById('waveSpeedValue').textContent = params.waveSpeed.toFixed(1);
  });
  
  // 扭曲强度
  const distortion = document.getElementById('distortion');
  distortion.addEventListener('input', (e) => {
    params.distortion = parseFloat(e.target.value);
    document.getElementById('distortionValue').textContent = params.distortion.toFixed(2);
  });
  
  // 顶点细分
  const subdivision = document.getElementById('subdivision');
  subdivision.addEventListener('input', (e) => {
    params.subdivision = parseInt(e.target.value);
    document.getElementById('subdivisionValue').textContent = params.subdivision;
    
    // 重新创建 Plane Billboard
    scene.remove(planeBillboard);
    createPlaneBillboard();
  });
  
  // 粒子数量
  const particleCount = document.getElementById('particleCount');
  particleCount.addEventListener('input', (e) => {
    params.particleCount = parseInt(e.target.value);
    document.getElementById('particleCountValue').textContent = params.particleCount;
    
    // 重新创建粒子系统
    scene.remove(particleSystem);
    createParticleSystem();
  });
}

// ========== 动画循环 ==========
function animate() {
  requestAnimationFrame(animate);
  
  time += 0.016 * params.waveSpeed;
  
  // 更新 Shader Billboard
  if (shaderBillboard) {
    shaderBillboard.material.uniforms.uTime.value = time;
    shaderBillboard.material.uniforms.uWaveAmplitude.value = params.waveAmplitude;
    shaderBillboard.material.uniforms.uDistortion.value = params.distortion;
    
    // 让它面向相机（Billboard 效果）
    shaderBillboard.lookAt(camera.position);
  }
  
  // 更新 Plane Billboard
  if (planeBillboard) {
    planeBillboard.material.uniforms.uTime.value = time;
    planeBillboard.material.uniforms.uWaveAmplitude.value = params.waveAmplitude;
    
    // 让它面向相机（Billboard 效果）
    planeBillboard.lookAt(camera.position);
  }
  
  // 更新粒子系统
  if (particleSystem) {
    particleSystem.material.uniforms.uTime.value = time;
    particleSystem.material.uniforms.uWaveAmplitude.value = params.waveAmplitude;
  }
  
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

