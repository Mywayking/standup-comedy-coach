/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // 注意：CDN 不支持目录路由（/path/），所有链接需不带斜杠
  // 静态文件生成 flat 结构：material.html 而非 material/index.html
}
export default nextConfig
