import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

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

// 三个控制参数
const params = {
  speed: 61,        // 速度：0-100
  spikes: 0.42,     // 细节密度：0-1
  processing: 0.50, // 形变幅度：0-1
};

// Billboard 平面
let billboard = null;
let currentTexture = null;
let time = 0;

// 初始化
init();

function init() {
  currentTexture = createDefaultTexture();
  createBillboard();
  setupControls();
  animate();
}

// ========== 创建 Billboard（方案2：Plane + LookAt + 顶点形变）==========
function createBillboard() {
  const size = 3.5;
  const segments = 64; // 高细分，支持顶点形变
  
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  
  // 自定义 Shader Material
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: currentTexture },
      uTime: { value: 0 },
      uSpeed: { value: params.speed / 100.0 }, // 归一化到 0-1
      uSpikes: { value: params.spikes },
      uProcessing: { value: params.processing },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uSpeed;
      uniform float uSpikes;
      uniform float uProcessing;
      
      varying vec2 vUv;
      varying float vElevation;
      
      // 简化的Perlin噪声（用于生成细节）
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      
      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        
        i = mod289(i);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }
      
      void main() {
        vUv = uv;
        
        vec3 pos = position;
        
        // 计算到中心的距离
        vec2 toCenter = uv - 0.5;
        float distToCenter = length(toCenter);
        
        // 圆形遮罩（只在气泡范围内形变）
        float mask = 1.0 - smoothstep(0.3, 0.5, distToCenter);
        
        // ========== 参数映射 ==========
        
        // 1. 速度 (Speed) → 控制时间流速
        float timeSpeed = uSpeed * 3.0; // 0-3倍速
        
        // 2. 细节密度 (Spikes) → 控制噪声频率
        // 值越大，细节越密集
        float noiseFrequency = 3.0 + uSpikes * 15.0; // 3-18的频率范围
        
        // 3. 形变幅度 (Processing) → 控制顶点偏移量
        float amplitude = uProcessing * 0.8; // 0-0.8的振幅
        
        // ========== 生成形变 ==========
        
        // 方法1：基于噪声的形变（主要形变）
        vec3 noiseCoord = vec3(
          uv.x * noiseFrequency,
          uv.y * noiseFrequency,
          uTime * timeSpeed
        );
        
        float noise = snoise(noiseCoord);
        
        // 方法2：叠加不同频率的噪声（增加细节）
        vec3 noiseCoord2 = noiseCoord * 2.0 + vec3(100.0, 100.0, 0.0);
        float noise2 = snoise(noiseCoord2) * 0.5;
        
        // 组合噪声
        float combinedNoise = noise + noise2;
        
        // 应用形变到Z轴（顶点偏移）
        float elevation = combinedNoise * amplitude * mask;
        pos.z += elevation;
        
        // 额外：轻微的XY偏移（让气泡更有机）
        pos.xy += toCenter * combinedNoise * amplitude * 0.1 * mask;
        
        vElevation = elevation;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform float uTime;
      uniform float uSpeed;
      uniform float uSpikes;
      uniform float uProcessing;
      
      varying vec2 vUv;
      varying float vElevation;
      
      void main() {
        vec2 center = vec2(0.5, 0.5);
        float distToCenter = length(vUv - center);
        
        // 采样纹理
        vec4 color = texture2D(uTexture, vUv);
        
        // 圆形遮罩（气泡形状）
        float alpha = 1.0 - smoothstep(0.45, 0.5, distToCenter);
        color.a *= alpha;
        
        // 基于高度的着色（增强立体感）
        float shading = vElevation * 0.5 + 0.5; // 归一化到 0-1
        color.rgb += vec3(shading) * 0.2 * uProcessing;
        
        // 边缘高光
        if (distToCenter > 0.42 && distToCenter < 0.48) {
          float edgeGlow = smoothstep(0.42, 0.45, distToCenter) * 
                          smoothstep(0.48, 0.45, distToCenter);
          color.rgb += vec3(edgeGlow * 0.5);
        }
        
        gl_FragColor = color;
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  
  billboard = new THREE.Mesh(geometry, material);
  scene.add(billboard);
  
  console.log('✅ Billboard 创建完成（方案2：Plane + LookAt + 顶点形变）');
  console.log('📊 参数说明:');
  console.log('  - Speed (速度): 控制动画速度，影响 uTime 的流速');
  console.log('  - Spikes (细节密度): 控制噪声频率，值越大细节越密');
  console.log('  - Processing (形变幅度): 控制顶点偏移量，值越大凹凸越明显');
}

// 创建默认纹理
function createDefaultTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // 径向渐变
  const gradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 256);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(0.2, 'rgba(220, 200, 255, 0.8)');
  gradient.addColorStop(0.4, 'rgba(180, 160, 255, 0.6)');
  gradient.addColorStop(0.6, 'rgba(140, 180, 255, 0.4)');
  gradient.addColorStop(0.8, 'rgba(100, 200, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(80, 150, 255, 0.1)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  // 高光
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(350, 150, 70, 0, Math.PI * 2);
  ctx.fill();
  
  // 小高光
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(180, 300, 40, 0, Math.PI * 2);
  ctx.fill();
  
  return new THREE.CanvasTexture(canvas);
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
      if (billboard) {
        billboard.material.uniforms.uTexture.value = texture;
      }
      console.log('✅ 纹理已更新');
    });
  };
  reader.readAsDataURL(file);
});

// ========== 控制面板 ==========
function setupControls() {
  // 速度 (Speed)
  const speedSlider = document.getElementById('speed');
  const speedValue = document.getElementById('speedValue');
  
  speedSlider.addEventListener('input', (e) => {
    params.speed = parseInt(e.target.value);
    speedValue.textContent = params.speed;
    
    if (billboard) {
      billboard.material.uniforms.uSpeed.value = params.speed / 100.0;
    }
    
    console.log(`⚡ 速度: ${params.speed}`);
  });
  
  // 细节密度 (Spikes)
  const spikesSlider = document.getElementById('spikes');
  const spikesValue = document.getElementById('spikesValue');
  
  spikesSlider.addEventListener('input', (e) => {
    params.spikes = parseFloat(e.target.value);
    spikesValue.textContent = params.spikes.toFixed(2);
    
    if (billboard) {
      billboard.material.uniforms.uSpikes.value = params.spikes;
    }
    
    console.log(`🔷 细节密度: ${params.spikes.toFixed(2)}`);
  });
  
  // 形变幅度 (Processing)
  const processingSlider = document.getElementById('processing');
  const processingValue = document.getElementById('processingValue');
  
  processingSlider.addEventListener('input', (e) => {
    params.processing = parseFloat(e.target.value);
    processingValue.textContent = params.processing.toFixed(2);
    
    if (billboard) {
      billboard.material.uniforms.uProcessing.value = params.processing;
    }
    
    console.log(`🌊 形变幅度: ${params.processing.toFixed(2)}`);
  });
}

// ========== 动画循环 ==========
function animate() {
  requestAnimationFrame(animate);
  
  // 时间增量（受速度参数影响）
  time += 0.016;
  
  // 更新Billboard
  if (billboard) {
    billboard.material.uniforms.uTime.value = time;
    
    // 让它面向相机（Billboard 效果）
    billboard.lookAt(camera.position);
    
    // 轻微的上下浮动
    billboard.position.y = Math.sin(time * 0.5) * 0.2;
  }
  
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

// 启动日志
console.log('🎯 Billboard 三参数控制系统');
console.log('');
console.log('📊 参数详解:');
console.log('');
console.log('1️⃣ 速度 (Speed): 0-100');
console.log('   - 控制动画播放速度');
console.log('   - 在Shader中转换为时间流速（0-3倍）');
console.log('   - 影响: uTime * (speed/100 * 3)');
console.log('');
console.log('2️⃣ 细节密度 (Spikes): 0.0-1.0');
console.log('   - 控制噪声频率（表面细节密度）');
console.log('   - 转换为: 3.0 + spikes * 15.0 (3-18的频率)');
console.log('   - 值越大，表面的"尖刺"或波纹越密集');
console.log('');
console.log('3️⃣ 形变幅度 (Processing): 0.0-1.0');
console.log('   - 控制顶点偏移量（形变强度）');
console.log('   - 转换为: processing * 0.8 (0-0.8的振幅)');
console.log('   - 值越大，凹凸越明显');
console.log('');
console.log('✨ 尝试调整滑块，观察气泡的变化！');

