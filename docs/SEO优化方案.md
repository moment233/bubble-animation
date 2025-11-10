# SEO 优化方案

## 一、SEO 目标与价值

### 核心目标
- 提升搜索引擎排名，增加自然流量
- 优化用户体验，提高转化率
- 建立品牌权威性与可信度

### 关键指标
- **自然搜索流量**：提升 50%+
- **关键词排名**：核心词进入前 3 页
- **页面收录率**：> 90%
- **Lighthouse SEO 评分**：> 95

---

## 二、技术 SEO 实施

### 2.1 Next.js 渲染策略

**SSR (Server-Side Rendering)**
- 适用场景：动态内容、个性化页面、实时数据
- 实施页面：用户中心、搜索结果页、动态列表
```typescript
// app/products/[id]/page.tsx
export default async function ProductPage({ params }) {
  const product = await fetchProduct(params.id);
  return <ProductDetail data={product} />;
}
```

**SSG (Static Site Generation)**
- 适用场景：静态内容、不常变化的页面
- 实施页面：首页、关于我们、帮助中心、博客文章
```typescript
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map(post => ({ slug: post.slug }));
}
```

**ISR (Incremental Static Regeneration)**
- 适用场景：定期更新的内容
- 实施页面：产品列表、新闻资讯
```typescript
export const revalidate = 3600; // 1小时重新生成
```

### 2.2 Meta 标签优化

**动态 Meta 标签**
```typescript
// app/layout.tsx 或页面级别
import { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const page = await fetchPageData(params.id);
  
  return {
    title: `${page.title} | 网站名`,
    description: page.description,
    keywords: page.keywords.join(', '),
    
    // Open Graph (社交分享)
    openGraph: {
      title: page.title,
      description: page.description,
      images: [page.coverImage],
      url: `https://example.com/${params.id}`,
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
      images: [page.coverImage],
    },
    
    // Canonical URL
    alternates: {
      canonical: `https://example.com/${params.id}`,
    },
  };
}
```

**Meta 标签最佳实践**
- **Title**：50-60 字符，包含核心关键词
- **Description**：150-160 字符，吸引点击
- **Keywords**：3-5 个核心词（现代 SEO 重要性降低）

### 2.3 结构化数据 (Schema.org)

**JSON-LD 实现**
```typescript
// components/StructuredData.tsx
export function ProductStructuredData({ product }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.description,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'CNY',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

**常用结构化数据类型**
- **Website**：网站基本信息
- **BreadcrumbList**：面包屑导航
- **Article**：文章/博客
- **Product**：产品信息
- **Organization**：公司/组织信息
- **FAQPage**：常见问题

### 2.4 Sitemap 自动生成

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://example.com';
  
  // 静态页面
  const staticPages = ['', '/about', '/contact'].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 1,
  }));
  
  // 动态页面（产品、文章等）
  const products = await fetchAllProducts();
  const productPages = products.map(product => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));
  
  return [...staticPages, ...productPages];
}
```

### 2.5 Robots.txt 配置

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/private/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 0,
      },
    ],
    sitemap: 'https://example.com/sitemap.xml',
  };
}
```

---

## 三、内容 SEO 优化

### 3.1 URL 结构
✅ **推荐**：简洁、语义化、包含关键词
```
https://example.com/products/wireless-headphones
https://example.com/blog/seo-best-practices-2025
```

❌ **避免**：过长、无意义参数
```
https://example.com/p?id=12345&cat=3&sort=desc
```

### 3.2 HTML 语义化
```html
<!-- 使用语义化标签 -->
<header>
  <nav>
    <ul>
      <li><a href="/home">首页</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>文章标题</h1>
    <section>
      <h2>章节标题</h2>
      <p>内容...</p>
    </section>
  </article>
</main>

<footer>
  版权信息
</footer>
```

### 3.3 标题层级优化
- **H1**：每页一个，包含核心关键词
- **H2-H6**：逻辑层级，辅助关键词
- 避免跳级（H1 → H3）

### 3.4 内部链接策略
- 相关内容互链（如：相关产品、推荐文章）
- 面包屑导航
- 站点地图页面
- 锚文本描述准确

### 3.5 图片优化
```typescript
// Next.js Image 组件自动优化
import Image from 'next/image';

<Image
  src="/product.jpg"
  alt="无线蓝牙耳机 - 降噪功能" // 描述性 alt 文本
  width={800}
  height={600}
  loading="lazy" // 懒加载
  quality={85}
/>
```

**图片 SEO 要点**
- Alt 文本：描述准确，包含关键词
- 文件名：描述性（product-headphones.jpg）
- 格式：WebP 优先，回退 JPEG/PNG
- 尺寸：响应式，按需加载

---

## 四、性能优化（影响 SEO）

### 4.1 Core Web Vitals 目标

| 指标 | 目标值 | 优化重点 |
|------|--------|----------|
| **LCP** (最大内容绘制) | < 2.5s | 图片优化、服务端渲染、CDN |
| **FID** (首次输入延迟) | < 100ms | 减少 JS 阻塞、代码分割 |
| **CLS** (累积布局偏移) | < 0.1 | 固定尺寸、避免动态插入 |

### 4.2 页面加载优化
```typescript
// 代码分割
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false, // 客户端渲染
});

// 预加载关键资源
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

// 预连接第三方域名
<link rel="preconnect" href="https://cdn.example.com" />
<link rel="dns-prefetch" href="https://analytics.example.com" />
```

### 4.3 资源优化
- **JS Bundle**：< 200KB (First Load)
- **CSS**：Critical CSS 内联，其余异步加载
- **字体**：font-display: swap，子集化
- **CDN**：静态资源使用 CDN 加速

---

## 五、移动端 SEO

### 5.1 响应式设计
```html
<!-- Viewport 配置 -->
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

### 5.2 移动友好性检查
- 文字可读（最小 16px）
- 点击目标足够大（最小 48x48px）
- 避免横向滚动
- 快速加载（< 3s）

### 5.3 AMP（可选）
- 适用于新闻、博客类内容
- 超快加载速度
- Google 搜索结果优先展示

---

## 六、本地 SEO（如有需要）

### 6.1 Google My Business
- 创建和优化商家信息
- 收集用户评价

### 6.2 本地结构化数据
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "公司名称",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "街道地址",
    "addressLocality": "城市",
    "postalCode": "邮编",
    "addressCountry": "CN"
  },
  "telephone": "+86-xxx-xxxx",
  "openingHours": "Mo-Fr 09:00-18:00"
}
```

---

## 七、SEO 监控与分析

### 7.1 工具集成
- **Google Search Console**：索引状态、关键词排名、点击率
- **Google Analytics 4**：流量来源、用户行为、转化追踪
- **Bing Webmaster Tools**：Bing 搜索优化
- **Lighthouse CI**：自动化性能和 SEO 测试

### 7.2 关键指标监控
- 自然搜索流量趋势
- 关键词排名变化
- 页面收录情况
- 爬虫错误（404、5xx）
- 回链数量与质量

### 7.3 A/B 测试
- 标题与描述优化测试
- 页面结构调整效果
- 内容策略迭代

---

## 八、实施计划

### Phase 1：基础配置（1 周）
- [ ] SSR/SSG 策略确定
- [ ] Meta 标签系统实现
- [ ] Sitemap + Robots.txt 配置
- [ ] Google Search Console 接入

### Phase 2：内容优化（1 周）
- [ ] URL 结构优化
- [ ] HTML 语义化检查
- [ ] 图片 Alt 文本补充
- [ ] 内部链接优化

### Phase 3：性能优化（1 周）
- [ ] Core Web Vitals 达标
- [ ] 图片格式优化（WebP）
- [ ] 代码分割与懒加载
- [ ] CDN 配置

### Phase 4：结构化数据（1-2 天）
- [ ] 关键页面添加 JSON-LD
- [ ] 富媒体搜索结果测试
- [ ] Schema 验证（Google Rich Results Test）

### Phase 5：监控与迭代（持续）
- [ ] 每周查看 Search Console 数据
- [ ] 每月 SEO 报告
- [ ] 根据数据调整策略

---

## 九、SEO Checklist

### 技术 SEO
- [ ] 所有页面可被爬虫访问
- [ ] Sitemap.xml 生成并提交
- [ ] Robots.txt 正确配置
- [ ] HTTPS 全站加密
- [ ] 移动端友好
- [ ] 页面加载速度 < 3s
- [ ] 无 404 错误页面
- [ ] Canonical URL 设置正确

### 页面 SEO
- [ ] 每页有唯一 Title 和 Description
- [ ] H1 标签包含核心关键词
- [ ] URL 简洁且语义化
- [ ] 图片有描述性 Alt 文本
- [ ] 内部链接结构合理
- [ ] 面包屑导航

### 内容 SEO
- [ ] 内容原创且有价值
- [ ] 关键词自然分布
- [ ] 定期更新内容
- [ ] 多媒体内容（图片、视频）

### 结构化数据
- [ ] 关键页面有 JSON-LD
- [ ] Schema 验证通过
- [ ] 富媒体搜索结果正常显示

---

## 十、常见问题与解决

### Q1: Next.js App Router 如何做 SEO？
**A:** 使用 generateMetadata 生成动态 Meta 标签，利用 SSR/SSG 确保内容可被爬虫抓取。

### Q2: 单页应用（SPA）SEO 不好？
**A:** Next.js 的 SSR/SSG 解决了这个问题，首屏内容服务端渲染，SEO 友好。

### Q3: 多长时间能看到 SEO 效果？
**A:** 通常 3-6 个月，取决于竞争程度和内容质量。技术 SEO 改进可能 2-4 周见效。

### Q4: 如何处理重复内容？
**A:** 使用 Canonical URL 指向首选版本，或用 robots meta 标签 noindex。

### Q5: 需要提交 sitemap 吗？
**A:** 是的，提交到 Google Search Console 和 Bing Webmaster Tools 加速收录。

---

## 附录：工具推荐

### SEO 分析工具
- **Google Search Console**：官方工具，必备
- **Ahrefs / SEMrush**：专业 SEO 工具（付费）
- **Screaming Frog**：网站爬虫与审计
- **Lighthouse**：性能与 SEO 测试

### 关键词研究
- **Google Keyword Planner**：关键词搜索量
- **Google Trends**：关键词趋势
- **Answer the Public**：长尾关键词挖掘

### 技术测试
- **Google Rich Results Test**：结构化数据验证
- **Mobile-Friendly Test**：移动端友好性
- **PageSpeed Insights**：性能分析


