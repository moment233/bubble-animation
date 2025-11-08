import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// 场景设置
const canvas = document.querySelector("#webgl");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f0c29);

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

// 控制参数
const params = {
  noiseType: 'fbm',
  amplitude: 0.3,
  frequency: 2.0,
  timeScale: 1.0,
  noiseScale: 5.0,
  octaves: 4,
  lacunarity: 2.0,
  persistence: 0.5,
  useVertexDeform: true,
  useUVDistortion: true,
  useRotation: false,
  useScale: false,
};

// Billboard 平面
let billboard = null;
let currentTexture = null;
let time = 0;

// 初始化
init();

function init() {
  currentTexture = createDefaultTexture();
  createNoiseBillboard();
  setupControls();
  animate();
}

// ========== 创建噪声驱动的 Billboard ==========
function createNoiseBillboard() {
  const size = 3.5;
  const segments = 64; // 高细分，支持顶点形变
  
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  
  // 自定义 Shader Material（包含完整的噪声函数库）
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: currentTexture },
      uTime: { value: 0 },
      uNoiseType: { value: 3 }, // 0: perlin, 1: simplex, 2: voronoi, 3: fbm, 4: turbulence
      uAmplitude: { value: params.amplitude },
      uFrequency: { value: params.frequency },
      uNoiseScale: { value: params.noiseScale },
      uOctaves: { value: params.octaves },
      uLacunarity: { value: params.lacunarity },
      uPersistence: { value: params.persistence },
      uUseVertexDeform: { value: params.useVertexDeform ? 1.0 : 0.0 },
      uUseUVDistortion: { value: params.useUVDistortion ? 1.0 : 0.0 },
      uUseRotation: { value: params.useRotation ? 1.0 : 0.0 },
      uUseScale: { value: params.useScale ? 1.0 : 0.0 },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uAmplitude;
      uniform float uFrequency;
      uniform float uNoiseScale;
      uniform int uNoiseType;
      uniform int uOctaves;
      uniform float uLacunarity;
      uniform float uPersistence;
      uniform float uUseVertexDeform;
      uniform float uUseScale;
      
      varying vec2 vUv;
      varying float vNoise;
      
      // ========== 噪声函数库 ==========
      
      // Perlin Noise 3D
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      
      float perlinNoise3D(vec3 v) {
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
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }
      
      // Simplex Noise (简化版，使用Perlin作为近似)
      float simplexNoise(vec3 v) {
        return perlinNoise3D(v);
      }
      
      // Voronoi Noise
      vec2 voronoiHash(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return fract(sin(p) * 43758.5453);
      }
      
      float voronoiNoise(vec3 v) {
        vec2 p = v.xy;
        vec2 i = floor(p);
        vec2 f = fract(p);
        
        float minDist = 1.0;
        
        for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = voronoiHash(i + neighbor);
            point = 0.5 + 0.5 * sin(v.z + 6.2831 * point);
            vec2 diff = neighbor + point - f;
            float dist = length(diff);
            minDist = min(minDist, dist);
          }
        }
        
        return minDist;
      }
      
      // FBM (Fractional Brownian Motion)
      float fbm(vec3 v) {
        float value = 0.0;
        float amplitude = 1.0;
        float frequency = 1.0;
        
        for (int i = 0; i < 8; i++) {
          if (i >= uOctaves) break;
          value += amplitude * perlinNoise3D(v * frequency);
          frequency *= uLacunarity;
          amplitude *= uPersistence;
        }
        
        return value;
      }
      
      // Turbulence (取绝对值的FBM)
      float turbulence(vec3 v) {
        float value = 0.0;
        float amplitude = 1.0;
        float frequency = 1.0;
        
        for (int i = 0; i < 8; i++) {
          if (i >= uOctaves) break;
          value += amplitude * abs(perlinNoise3D(v * frequency));
          frequency *= uLacunarity;
          amplitude *= uPersistence;
        }
        
        return value;
      }
      
      // 统一的噪声接口
      float getNoise(vec3 v) {
        if (uNoiseType == 0) return perlinNoise3D(v);
        else if (uNoiseType == 1) return simplexNoise(v);
        else if (uNoiseType == 2) return voronoiNoise(v);
        else if (uNoiseType == 3) return fbm(v);
        else if (uNoiseType == 4) return turbulence(v);
        return 0.0;
      }
      
      void main() {
        vUv = uv;
        
        vec3 pos = position;
        
        // 噪声采样点（包含时间维度）
        vec3 noiseCoord = vec3(
          uv.x * uNoiseScale,
          uv.y * uNoiseScale,
          uTime * uFrequency
        );
        
        // 获取噪声值
        float noise = getNoise(noiseCoord);
        vNoise = noise;
        
        // 计算到中心的距离（用于遮罩）
        vec2 toCenter = uv - 0.5;
        float distToCenter = length(toCenter);
        float mask = 1.0 - smoothstep(0.3, 0.5, distToCenter);
        
        // 顶点形变（Z轴）
        if (uUseVertexDeform > 0.5) {
          pos.z += noise * uAmplitude * mask;
        }
        
        // 缩放脉动
        if (uUseScale > 0.5) {
          float scaleFactor = 1.0 + noise * uAmplitude * 0.3 * mask;
          pos.xy *= scaleFactor;
        }
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform float uTime;
      uniform float uAmplitude;
      uniform float uFrequency;
      uniform float uNoiseScale;
      uniform int uNoiseType;
      uniform int uOctaves;
      uniform float uLacunarity;
      uniform float uPersistence;
      uniform float uUseUVDistortion;
      uniform float uUseRotation;
      
      varying vec2 vUv;
      varying float vNoise;
      
      // 复制顶点着色器的噪声函数（Fragment Shader也需要）
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      
      float perlinNoise3D(vec3 v) {
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
      
      float fbm(vec3 v) {
        float value = 0.0;
        float amplitude = 1.0;
        float frequency = 1.0;
        for (int i = 0; i < 8; i++) {
          if (i >= uOctaves) break;
          value += amplitude * perlinNoise3D(v * frequency);
          frequency *= uLacunarity;
          amplitude *= uPersistence;
        }
        return value;
      }
      
      float getNoise(vec3 v) {
        if (uNoiseType == 0) return perlinNoise3D(v);
        else if (uNoiseType == 3) return fbm(v);
        return perlinNoise3D(v);
      }
      
      void main() {
        vec2 uv = vUv;
        vec2 center = vec2(0.5, 0.5);
        vec2 toCenter = uv - center;
        float distToCenter = length(toCenter);
        
        // UV扭曲
        if (uUseUVDistortion > 0.5) {
          vec3 noiseCoord = vec3(uv * uNoiseScale, uTime * uFrequency);
          float noiseX = getNoise(noiseCoord);
          float noiseY = getNoise(noiseCoord + vec3(100.0, 100.0, 0.0));
          
          float mask = 1.0 - smoothstep(0.3, 0.5, distToCenter);
          uv += vec2(noiseX, noiseY) * uAmplitude * 0.1 * mask;
        }
        
        // 旋转扭曲
        if (uUseRotation > 0.5) {
          vec3 noiseCoord = vec3(uv * uNoiseScale, uTime * uFrequency);
          float angle = getNoise(noiseCoord) * uAmplitude * 0.5;
          float s = sin(angle);
          float c = cos(angle);
          vec2 rotated = vec2(
            toCenter.x * c - toCenter.y * s,
            toCenter.x * s + toCenter.y * c
          );
          uv = center + rotated;
        }
        
        // 采样纹理
        vec4 color = texture2D(uTexture, uv);
        
        // 圆形遮罩（气泡形状）
        float alpha = 1.0 - smoothstep(0.45, 0.5, distToCenter);
        color.a *= alpha;
        
        // 边缘高光（基于噪声）
        if (distToCenter > 0.4 && distToCenter < 0.48) {
          float edgeNoise = vNoise * 0.5 + 0.5;
          color.rgb += vec3(edgeNoise) * 0.5;
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
  
  console.log('✅ 噪声驱动的 Billboard 创建完成');
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
  gradient.addColorStop(0.3, 'rgba(220, 180, 255, 0.7)');
  gradient.addColorStop(0.6, 'rgba(150, 200, 255, 0.5)');
  gradient.addColorStop(1, 'rgba(100, 150, 255, 0.2)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  // 高光
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(350, 150, 70, 0, Math.PI * 2);
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
  // 噪声类型
  document.getElementById('noiseType').addEventListener('change', (e) => {
    const typeMap = {
      'perlin': 0,
      'simplex': 1,
      'voronoi': 2,
      'fbm': 3,
      'turbulence': 4
    };
    params.noiseType = e.target.value;
    billboard.material.uniforms.uNoiseType.value = typeMap[e.target.value];
    console.log('噪声类型:', e.target.value);
  });
  
  // 基础参数
  setupSlider('amplitude', 'amplitudeValue', (v) => {
    params.amplitude = v;
    billboard.material.uniforms.uAmplitude.value = v;
  });
  
  setupSlider('frequency', 'frequencyValue', (v) => {
    params.frequency = v;
    billboard.material.uniforms.uFrequency.value = v;
  });
  
  setupSlider('timeScale', 'timeScaleValue', (v) => {
    params.timeScale = v;
  });
  
  setupSlider('noiseScale', 'noiseScaleValue', (v) => {
    params.noiseScale = v;
    billboard.material.uniforms.uNoiseScale.value = v;
  });
  
  // FBM 参数
  setupSlider('octaves', 'octavesValue', (v) => {
    params.octaves = parseInt(v);
    billboard.material.uniforms.uOctaves.value = parseInt(v);
  });
  
  setupSlider('lacunarity', 'lacunarityValue', (v) => {
    params.lacunarity = v;
    billboard.material.uniforms.uLacunarity.value = v;
  });
  
  setupSlider('persistence', 'persistenceValue', (v) => {
    params.persistence = v;
    billboard.material.uniforms.uPersistence.value = v;
  });
  
  // 形变模式
  setupCheckbox('useVertexDeform', (checked) => {
    params.useVertexDeform = checked;
    billboard.material.uniforms.uUseVertexDeform.value = checked ? 1.0 : 0.0;
  });
  
  setupCheckbox('useUVDistortion', (checked) => {
    params.useUVDistortion = checked;
    billboard.material.uniforms.uUseUVDistortion.value = checked ? 1.0 : 0.0;
  });
  
  setupCheckbox('useRotation', (checked) => {
    params.useRotation = checked;
    billboard.material.uniforms.uUseRotation.value = checked ? 1.0 : 0.0;
  });
  
  setupCheckbox('useScale', (checked) => {
    params.useScale = checked;
    billboard.material.uniforms.uUseScale.value = checked ? 1.0 : 0.0;
  });
  
  // 预设效果
  setupPresets();
}

function setupSlider(id, valueId, callback) {
  const slider = document.getElementById(id);
  const valueDisplay = document.getElementById(valueId);
  
  slider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    valueDisplay.textContent = value.toFixed(2);
    callback(value);
  });
}

function setupCheckbox(id, callback) {
  document.getElementById(id).addEventListener('change', (e) => {
    callback(e.target.checked);
  });
}

function setupPresets() {
  // 轻柔波动
  document.getElementById('preset-gentle').addEventListener('click', () => {
    applyPreset({
      noiseType: 'fbm',
      amplitude: 0.15,
      frequency: 1.0,
      noiseScale: 3.0,
      octaves: 3,
      lacunarity: 2.0,
      persistence: 0.5,
      timeScale: 0.5,
      useVertexDeform: true,
      useUVDistortion: false,
      useRotation: false,
      useScale: false,
    });
  });
  
  // 疯狂扭曲
  document.getElementById('preset-crazy').addEventListener('click', () => {
    applyPreset({
      noiseType: 'turbulence',
      amplitude: 0.8,
      frequency: 3.0,
      noiseScale: 10.0,
      octaves: 6,
      lacunarity: 2.5,
      persistence: 0.6,
      timeScale: 2.0,
      useVertexDeform: true,
      useUVDistortion: true,
      useRotation: true,
      useScale: true,
    });
  });
  
  // 气泡脉动
  document.getElementById('preset-bubble').addEventListener('click', () => {
    applyPreset({
      noiseType: 'perlin',
      amplitude: 0.25,
      frequency: 2.0,
      noiseScale: 4.0,
      octaves: 2,
      lacunarity: 2.0,
      persistence: 0.5,
      timeScale: 1.5,
      useVertexDeform: true,
      useUVDistortion: false,
      useRotation: false,
      useScale: true,
    });
  });
  
  // 火焰效果
  document.getElementById('preset-flame').addEventListener('click', () => {
    applyPreset({
      noiseType: 'turbulence',
      amplitude: 0.4,
      frequency: 2.5,
      noiseScale: 8.0,
      octaves: 5,
      lacunarity: 2.2,
      persistence: 0.55,
      timeScale: 2.5,
      useVertexDeform: true,
      useUVDistortion: true,
      useRotation: false,
      useScale: false,
    });
  });
  
  // 水波涟漪
  document.getElementById('preset-water').addEventListener('click', () => {
    applyPreset({
      noiseType: 'fbm',
      amplitude: 0.2,
      frequency: 1.5,
      noiseScale: 6.0,
      octaves: 4,
      lacunarity: 2.0,
      persistence: 0.4,
      timeScale: 1.0,
      useVertexDeform: true,
      useUVDistortion: true,
      useRotation: false,
      useScale: false,
    });
  });
  
  // 有机生长
  document.getElementById('preset-organic').addEventListener('click', () => {
    applyPreset({
      noiseType: 'voronoi',
      amplitude: 0.35,
      frequency: 0.8,
      noiseScale: 5.0,
      octaves: 3,
      lacunarity: 1.8,
      persistence: 0.6,
      timeScale: 0.8,
      useVertexDeform: true,
      useUVDistortion: true,
      useRotation: true,
      useScale: false,
    });
  });
}

function applyPreset(preset) {
  // 更新参数
  Object.assign(params, preset);
  
  // 更新UI
  document.getElementById('noiseType').value = preset.noiseType;
  document.getElementById('amplitude').value = preset.amplitude;
  document.getElementById('amplitudeValue').textContent = preset.amplitude.toFixed(2);
  document.getElementById('frequency').value = preset.frequency;
  document.getElementById('frequencyValue').textContent = preset.frequency.toFixed(1);
  document.getElementById('timeScale').value = preset.timeScale;
  document.getElementById('timeScaleValue').textContent = preset.timeScale.toFixed(1);
  document.getElementById('noiseScale').value = preset.noiseScale;
  document.getElementById('noiseScaleValue').textContent = preset.noiseScale.toFixed(1);
  document.getElementById('octaves').value = preset.octaves;
  document.getElementById('octavesValue').textContent = preset.octaves;
  document.getElementById('lacunarity').value = preset.lacunarity;
  document.getElementById('lacunarityValue').textContent = preset.lacunarity.toFixed(1);
  document.getElementById('persistence').value = preset.persistence;
  document.getElementById('persistenceValue').textContent = preset.persistence.toFixed(2);
  
  document.getElementById('useVertexDeform').checked = preset.useVertexDeform;
  document.getElementById('useUVDistortion').checked = preset.useUVDistortion;
  document.getElementById('useRotation').checked = preset.useRotation;
  document.getElementById('useScale').checked = preset.useScale;
  
  // 更新Shader
  const typeMap = { 'perlin': 0, 'simplex': 1, 'voronoi': 2, 'fbm': 3, 'turbulence': 4 };
  billboard.material.uniforms.uNoiseType.value = typeMap[preset.noiseType];
  billboard.material.uniforms.uAmplitude.value = preset.amplitude;
  billboard.material.uniforms.uFrequency.value = preset.frequency;
  billboard.material.uniforms.uNoiseScale.value = preset.noiseScale;
  billboard.material.uniforms.uOctaves.value = preset.octaves;
  billboard.material.uniforms.uLacunarity.value = preset.lacunarity;
  billboard.material.uniforms.uPersistence.value = preset.persistence;
  billboard.material.uniforms.uUseVertexDeform.value = preset.useVertexDeform ? 1.0 : 0.0;
  billboard.material.uniforms.uUseUVDistortion.value = preset.useUVDistortion ? 1.0 : 0.0;
  billboard.material.uniforms.uUseRotation.value = preset.useRotation ? 1.0 : 0.0;
  billboard.material.uniforms.uUseScale.value = preset.useScale ? 1.0 : 0.0;
  
  console.log('✅ 预设已应用:', preset);
}

// ========== 动画循环 ==========
function animate() {
  requestAnimationFrame(animate);
  
  time += 0.016 * params.timeScale;
  
  // 更新Billboard
  if (billboard) {
    billboard.material.uniforms.uTime.value = time;
    
    // 让它面向相机（Billboard 效果）
    billboard.lookAt(camera.position);
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

// 启动提示
console.log('🌊 噪声驱动的 Billboard 形变系统');
console.log('');
console.log('💡 噪声类型:');
console.log('  - Perlin Noise: 经典平滑噪声');
console.log('  - Simplex Noise: 改进版Perlin');
console.log('  - Voronoi: 细胞状结构');
console.log('  - FBM: 多层叠加，细节丰富');
console.log('  - Turbulence: 湍流效果');
console.log('');
console.log('🎛️ 使用控制面板调整参数，或点击预设效果快速体验！');

