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

// 存储右侧球体，用于更新纹理
let texturedSphere = null;

// 加载 HDR 环境贴图
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  // "/studio_small_08_1k.hdr",
  // "/JCI54553017162.hdr",
  // "/JCI54551673495.hdr",
  "/little_paris_eiffel_tower_1k.hdr",
  (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    scene.background = new THREE.Color(0x0a0a0a);

    texture.dispose();
    pmremGenerator.dispose();

    createSpheres();
    console.log("✅ 场景创建成功！");
  },
  undefined,
  (error) => {
    console.error("❌ HDR 加载失败:", error);
    // 即使 HDR 加载失败也创建球体
    createSpheres();
  }
);

// 创建对比球体
function createSpheres() {
  const sphereSize = 2;
  const separation = 4;

  // ========== 左侧：物理材质球体（程序化彩虹效果）==========
  const physicalGeometry = new THREE.SphereGeometry(sphereSize, 64, 64);
  const physicalMaterial = new THREE.MeshPhysicalMaterial({
    // 薄膜干涉（彩虹色）
    iridescence: 1.0,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [0, 800],

    // 透明和折射
    transmission: 0.9,
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

  const physicalSphere = new THREE.Mesh(physicalGeometry, physicalMaterial);
  physicalSphere.position.x = -separation / 2;
  scene.add(physicalSphere);

  // ========== 右侧：图片纹理球体 ==========
  const texturedGeometry = new THREE.SphereGeometry(sphereSize, 64, 64);
  
  // 创建默认的彩色材质（在加载图片之前显示）
  const defaultMaterial = new THREE.MeshStandardMaterial({
    color: 0x4fc3f7,
    metalness: 0.5,
    roughness: 0.3,
    envMapIntensity: 1.5,
  });

  texturedSphere = new THREE.Mesh(texturedGeometry, defaultMaterial);
  texturedSphere.position.x = separation / 2;
  scene.add(texturedSphere);

  // 添加标签
  addLabel("物理材质\n(程序化)", -separation / 2, -sphereSize - 1);
  addLabel("图片纹理\n(上传图片)", separation / 2, -sphereSize - 1);

  console.log("✅ 球体创建完成");
}

// 添加文字标签
function addLabel(text, x, y) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 512;
  canvas.height = 256;

  context.fillStyle = "rgba(0, 0, 0, 0.8)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.font = "bold 40px Arial";
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

// ========== 图片上传功能（支持 HDR 和普通图片）==========
const fileInput = document.getElementById("fileInput");
const fileNameDisplay = document.getElementById("fileName");

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  fileNameDisplay.textContent = `已选择: ${file.name}`;

  const fileName = file.name.toLowerCase();
  const isHDR = fileName.endsWith('.hdr');

  if (isHDR) {
    // ========== HDR 格式：使用 RGBELoader ==========
    console.log("🎨 检测到 HDR 格式，使用 RGBELoader...");
    
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
          
          // HDR 需要特殊处理：转换为 PMREM 环境贴图格式
          const pmremGenerator = new THREE.PMREMGenerator(renderer);
          const envMap = pmremGenerator.fromEquirectangular(texture).texture;
          
          // 更新右侧球体的材质
          if (texturedSphere) {
            const newMaterial = new THREE.MeshStandardMaterial({
              map: texture, // 直接使用 HDR 纹理作为贴图
              metalness: 0.3,
              roughness: 0.4,
              envMapIntensity: 2.0, // HDR 可以用更高的强度
            });

            texturedSphere.material.dispose();
            texturedSphere.material = newMaterial;

            console.log("✅ HDR 纹理已应用到球体！");
          }

          // 清理
          URL.revokeObjectURL(url);
          texture.dispose();
          pmremGenerator.dispose();
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
    // ========== 普通图片格式（JPG, PNG 等）：使用 TextureLoader ==========
    console.log("🖼️ 检测到普通图片格式，使用 TextureLoader...");
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target.result;

      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        imageUrl,
        (texture) => {
          console.log("✅ 图片加载成功！");

          // 更新右侧球体的材质
          if (texturedSphere) {
            const newMaterial = new THREE.MeshStandardMaterial({
              map: texture, // 这就是关键：map 属性接收纹理
              metalness: 0.3,
              roughness: 0.4,
              envMapIntensity: 1.0,
            });

            // 替换旧材质
            texturedSphere.material.dispose();
            texturedSphere.material = newMaterial;

            console.log("✅ 纹理已应用到球体！");
          }
        },
        undefined,
        (error) => {
          console.error("❌ 图片加载失败:", error);
          alert("图片加载失败，请尝试其他图片");
        }
      );
    };

    reader.readAsDataURL(file);
  }
});

// 动画循环
function animate() {
  requestAnimationFrame(animate);

  // 缓慢旋转球体
  if (texturedSphere) {
    texturedSphere.rotation.y += 0.005;
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

