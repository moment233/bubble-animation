# 🔧 故障排除指南

## 常见问题解决

### 1. 控制面板不显示

**原因**: Tailwind CSS 样式加载问题或 z-index 冲突

**解决方案**:
- ✅ 已使用内联样式 (style) 替代 Tailwind 类名
- ✅ 控制面板 z-index 设置为 1000
- ✅ globals.css 中添加了 range input 样式

### 2. 气泡显示效果与原版不同

**可能原因**:

#### A. 景深参数需要调整
@react-three/postprocessing 的 DepthOfField 参数与原生 Three.js BokehPass 不同：

**原生 BokehPass**:
```javascript
{
  focus: 10.0,      // 直接距离值
  aperture: 0.0001, // 光圈值
  maxblur: 0.01     // 最大模糊
}
```

**React Three Postprocessing**:
```javascript
{
  focusDistance: focus / 10,    // 归一化值
  focalLength: aperture * 100,  // 焦距
  bokehScale: maxBlur * 100     // 散景缩放
}
```

**调整建议**:
- 增大 **光圈大小** 到 0.0005-0.001
- 增大 **最大模糊** 到 0.02-0.05
- 调整 **焦点距离** 查看不同深度的效果

#### B. HDR 环境贴图加载
检查浏览器控制台是否有：
```
✅ Environment map loaded successfully!
```

如果没有，检查:
- `/public/little_paris_eiffel_tower_1k.hdr` 文件是否存在
- 浏览器Network面板查看文件是否404

#### C. 气泡数量显示
如果气泡数量少于15个：
- 检查控制台是否有错误
- 确认 envMap 已加载（气泡只在 envMap 加载后创建）

### 3. 性能问题

如果帧率低于 30fps：

**优化选项**:
- 减少气泡数量（15 → 10）
- 降低球体分段数（64 → 32）
- 禁用后处理（注释 PostProcessing 组件）
- 降低像素比

### 4. 黑色闪烁斑点

**已解决**: Shader中已移除噪声函数

如果仍然出现：
- 检查 `bubbleShaders.ts` 是否是最新版本
- 确认厚度计算没有噪声

### 5. 开发服务器启动失败

```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install

# 重新启动
npm run dev
```

### 6. TypeScript 类型错误

如果遇到 Three.js 类型错误：
```bash
npm install -D @types/three
```

## 🎯 参数调试建议

### 看不到模糊效果
1. 增大光圈: 0.0001 → 0.001
2. 增大最大模糊: 0.01 → 0.05
3. 调整焦点距离,确保气泡在焦点外

### 模糊太强
1. 减小光圈: → 0.00005
2. 减小最大模糊: → 0.005

### 气泡太亮或太暗
修改 `bubbleShaders.ts` 中的:
```glsl
finalColor *= 2.2;  // 调整亮度系数
```

## 📞 需要帮助?

1. 检查浏览器控制台错误
2. 检查 Network 面板资源加载
3. 对比原版 HTML 文件参数
4. 查看 DevTools 的 React 组件树

