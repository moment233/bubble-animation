import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise";

//input値取得
let speedSlider = $('input[name="speed"]'),
  spikesSlider = $('input[name="spikes"]'),
  processingSlider = $('input[name="processing"]');

//canvas
const canvas = document.querySelector("#webgl");

//シーン
const scene = new THREE.Scene();

//サイズ
const sizes = {
  width: innerWidth,
  height: innerHeight,
};

//カメラ
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.z = 3;

//レンダラー
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true, //背景を透明にする
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(window.devicePixelRatio);

//オブジェクトを作成
const geometry = new THREE.SphereGeometry(1.5, 128, 128);
const positionAttributeBase = geometry.getAttribute("position").clone(); //頂点を操作する用のクローンを作成
const material = new THREE.MeshPhysicalMaterial({
  // wireframe: true,
  color: 0xffffff,
  transparent: true,
  side: THREE.DoubleSide,
  transmission: 1, //透過率
  metalness: 0, //金属製
  roughness: 0, //粗さ
  ior: 1.2, //屈折率
  specularIntensity: 1, //反射量
  specularColor: 0xffffff, //反射色
});

//影の描画を有効化
renderer.shadowMap.enabled = true;

//ライトを追加
let lightTop = new THREE.DirectionalLight(0xffffff, 0.8);
lightTop.position.set(5, 40, -50);
scene.add(lightTop);

let lightBottom = new THREE.DirectionalLight(0xffffff, 2);
lightBottom.position.set(0, 0, 400);
scene.add(lightBottom);

//オブジェクトをシーンに追加
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

//SimplexNoise
const simplex = new SimplexNoise();
//3Dベクトルを表すコンテナを作成
const vector = new THREE.Vector3();

let update = () => {
  //基準を指定
  let time =
      performance.now() *
      0.00001 *
      speedSlider.val() *
      Math.pow(processingSlider.val(), 3),
    spikes = spikesSlider.val() * processingSlider.val();
  const positionAttribute = geometry.getAttribute("position");
  for (let i = 0; i < positionAttributeBase.count; i++) {
    vector.fromBufferAttribute(positionAttributeBase, i); //頂点を取り出す
    const noise = simplex.noise3d(
      vector.x * spikes,
      vector.y * spikes,
      vector.z * spikes + time
    );
    const ratio = noise * 0.05 + 0.98;
    vector.multiplyScalar(ratio); //ベクトルの各要素をratio乗する
    positionAttribute.setXYZ(i, vector.x, vector.y, vector.z); //頂点座標を更新
  }
  sphere.geometry.attributes.position.needsUpdate = true; //頂点座標が変更されたことをThree.jsに通知
  sphere.geometry.computeVertexNormals(); //法線ベクトルを計算
};

//アニメーション
const tick = () => {
  update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};
tick();
