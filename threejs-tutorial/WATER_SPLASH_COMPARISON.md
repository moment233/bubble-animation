# Three-Nebula 水滴飞溅效果对比

## 您提供的代码 vs 真正的水滴飞溅

### ❌ 您提供的代码（粒子喷泉效果）

```javascript
// 1. 持续发射（不是瞬间爆发）
.setRate(new Rate(new Span(4, 16), new Span(0.01)))
// 问题：持续每0.01秒发射4-16个粒子 → 像喷泉

// 2. 只向上发射，180度扩散
new RadialVelocity(45, new Vector3D(0, 1, 0), 180)
// 问题：只向上半球发射，速度太慢（45）

// 3. 没有重力
// 问题：粒子不会下落，违反物理规律

// 4. 发射器在运动
updateEmitter(emitter, tha);
// 问题：发射器在轨道上移动，不是固定点爆发
```

**这个效果是：** 🎆 **彩色粒子喷泉 / 烟花轨迹**

---

### ✅ 真正的水滴飞溅效果

```javascript
// 1. 瞬间爆发
.setRate(new Rate(
  new Span(30, 50),      // 一次发射30-50个粒子
  new Span(0.05, 0.1)    // 只持续0.05-0.1秒
))
.emit(0.1);  // 发射后自动停止

// 2. 360度全方位发射 + 高速度
new RadialVelocity(
  15,                    // 高速度
  new Vector3D(0, 1, 0), // 主要向上
  360                    // 360度全方位
)

// 3. 重力效果
new Gravity(3)  // 粒子会下落

// 4. 固定点爆发
createWaterSplash(x, y, z)  // 在固定位置爆发
```

**这个效果是：** 💧 **真实的水滴飞溅**

---

## 关键差异对比表

| 特性         | 您的代码     | 水滴飞溅    |
| ------------ | ------------ | ----------- |
| **发射方式** | 持续发射     | 瞬间爆发    |
| **发射方向** | 向上 180°    | 全方位 360° |
| **速度**     | 45（慢）     | 15-25（快） |
| **重力**     | ❌ 无        | ✅ 有       |
| **发射器**   | 移动轨道     | 固定点      |
| **生命周期** | 3 秒         | 1-2 秒      |
| **效果**     | 🎆 喷泉/烟花 | 💧 水滴飞溅 |

---

## 如何在气泡项目中使用

### 场景 1: 气泡破裂后的水滴飞溅

```javascript
// 在气泡破裂时触发
function burstBubble(bubble) {
  const bubblePosition = bubble.mesh.position;

  // 生成水滴飞溅
  createWaterSplash(bubblePosition.x, bubblePosition.y, bubblePosition.z);

  // 移除气泡
  scene.remove(bubble.mesh);
}
```

### 场景 2: 多层飞溅效果

```javascript
function createLayeredSplash(x, y, z) {
  // 第一层：快速小水滴
  const emitter1 = new Emitter()
    .setRate(new Rate(new Span(20, 30), new Span(0.05)))
    .addInitializers([
      new Position(new PointZone(x, y, z)),
      new Radius(0.1, 0.2),
      new RadialVelocity(20, new Vector3D(0, 1, 0), 360),
    ])
    .addBehaviours([new Gravity(4), new Alpha(0.9, 0)])
    .emit(0.1);

  // 第二层：慢速大水滴
  const emitter2 = new Emitter()
    .setRate(new Rate(new Span(10, 15), new Span(0.05)))
    .addInitializers([
      new Position(new PointZone(x, y, z)),
      new Radius(0.3, 0.5),
      new RadialVelocity(10, new Vector3D(0, 1, 0), 360),
    ])
    .addBehaviours([new Gravity(3), new Alpha(0.8, 0)])
    .emit(0.1);

  nebula.addEmitter(emitter1);
  nebula.addEmitter(emitter2);
}
```

---

## 运行演示

打开文件：

```bash
# 水滴飞溅效果
water-splash-nebula.html
```

点击屏幕任意位置即可看到真实的水滴飞溅效果！

---

## Three-Nebula 核心参数说明

### Rate (发射速率)

```javascript
new Rate(
  new Span(30, 50), // 每次发射的粒子数量
  new Span(0.05, 0.1) // 发射持续时间（秒）
);
```

### RadialVelocity (径向速度)

```javascript
new RadialVelocity(
  15, // 速度大小
  new Vector3D(0, 1, 0), // 发射方向
  360 // 扩散角度
);
```

### Gravity (重力)

```javascript
new Gravity(3); // 重力加速度（越大下落越快）
```

### emit() vs setRate()

- `emit(duration)`: 发射指定时间后停止（瞬间爆发）
- `setRate()`: 持续发射（喷泉效果）

---

## 总结

您提供的代码**不是水滴飞溅**，而是：

- 🎆 彩色粒子喷泉
- 🌈 移动的烟花轨迹
- ✨ 持续发射的粒子流

真正的水滴飞溅需要：

1. ⚡ 瞬间爆发（`emit()`）
2. 🌐 360 度发射
3. ⬇️ 重力效果（`Gravity`）
4. 📍 固定点爆发
5. 💨 高速度

已经为您创建了 `water-splash-nebula.html` 演示文件，打开即可看到真实效果！
