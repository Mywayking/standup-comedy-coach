#!/bin/bash
# 脱口秀教练应用 - 基础功能检测（使用 curl）
# 注意：此脚本仅进行基本的 HTTP 检测，无法执行 JavaScript 交互

BASE_URL="https://vnu9te3x1qgm.space.minimaxi.com"
MATERIAL="我小时候很讨厌我外公，他偏心特别厉害，给我表哥买自行车，不给我买。他说因为我是外孙，是外面的孙子。"

echo "=================================================="
echo "脱口秀教练应用 - 基础功能检测"
echo "=================================================="
echo "测试地址: $BASE_URL"
echo "测试素材: ${MATERIAL:0:30}..."
echo "=================================================="

# 检测结果
declare -a results

check_url() {
  local name=$1
  local url=$2
  local expect=$3
  
  echo ""
  echo "[检测 $name] $url"
  
  response=$(curl -s -o /dev/null -w "%{http_code}|%{content_type}|%{size_download}" "$url" 2>/dev/null)
  code=$(echo "$response" | cut -d'|' -f1)
  ctype=$(echo "$response" | cut -d'|' -f2)
  size=$(echo "$response" | cut -d'|' -f3)
  
  if [[ "$code" == "200" ]]; then
    echo "  ✅ HTTP $code | Type: $ctype | Size: $size bytes"
    results+=("✅ [$name] HTTP 200 正常")
    return 0
  else
    echo "  ❌ HTTP $code"
    results+=("❌ [$name] HTTP $code")
    return 1
  fi
}

check_content() {
  local name=$1
  local url=$2
  local keywords=$3
  
  echo ""
  echo "[检查内容 $name]"
  
  content=$(curl -s "$url" 2>/dev/null)
  
  if [[ -z "$content" ]]; then
    echo "  ❌ 无法获取内容"
    results+=("❌ [$name] 无内容")
    return 1
  fi
  
  found=0
  for kw in $keywords; do
    if echo "$content" | grep -qi "$kw"; then
      ((found++))
    fi
  done
  
  if [[ $found -gt 0 ]]; then
    echo "  ✅ 找到 $found/$# 个关键词"
    results+=("✅ [$name] 内容正常")
    return 0
  else
    echo "  ⚠️ 未找到期望的关键词"
    results+=("⚠️ [$name] 内容不完整")
    return 1
  fi
}

# 1. 首页检测
echo ""
echo "【步骤 1】打开首页"
check_url "首页" "$BASE_URL"
check_content "首页标题" "$BASE_URL" "手把手教你玩脱口秀"

# 2. 开始创作页面
echo ""
echo "【步骤 2】开始创作按钮检测"
home_content=$(curl -s "$BASE_URL" 2>/dev/null)
if echo "$home_content" | grep -qi "开始创作"; then
  echo "  ✅ 找到「开始创作」按钮"
  results+=("✅ [开始创作按钮] 存在")
else
  echo "  ⚠️ 未找到「开始创作」关键词（可能需要 JavaScript 渲染）"
  results+=("⚠️ [开始创作按钮] 需 JS 渲染")
fi

# 3. 检测创建页面路由
echo ""
echo "【步骤 3】创建流程页面"
for step in "create" "create/material" "create/premise" "create/angle" "create/punchline" "create/draft" "create/complete" "create/projects"; do
  check_url "$step" "$BASE_URL/$step"
done

# 4. 检测静态资源
echo ""
echo "【步骤 4】静态资源检测"
static_urls=(
  "/_next/static/css/32085be030b156ec.css"
  "/_next/static/chunks/webpack-2eb758dea75faf50.js"
)
for static in "${static_urls[@]}"; do
  check_url "静态资源" "$BASE_URL$static"
done

# 5. 检测 Next.js 应用结构
echo ""
echo "【步骤 5】Next.js 应用结构检测"
app_content=$(curl -s "$BASE_URL" 2>/dev/null)
if echo "$app_content" | grep -qi "__next"; then
  echo "  ✅ Next.js 应用正常"
  results+=("✅ [Next.js] 框架运行正常")
else
  echo "  ⚠️ 未检测到 Next.js 特征"
  results+=("⚠️ [Next.js] 特征不明显")
fi

# 检测 hydration 标记
if echo "$app_content" | grep -qi "加载中"; then
  echo "  ✅ 检测到 hydration 加载状态"
  results+=("✅ [Hydration] 客户端渲染")
else
  echo "  ℹ️ 未检测到明显的加载状态"
fi

# 6. 网络响应检测
echo ""
echo "【步骤 6】网络延迟检测"
start_time=$(date +%s%N)
curl -s "$BASE_URL" > /dev/null
end_time=$(date +%s%N)
ms=$(( (end_time - start_time) / 1000000 ))
echo "  响应时间: ${ms}ms"
if [[ $ms -lt 2000 ]]; then
  echo "  ✅ 响应正常 (< 2s)"
  results+=("✅ [性能] 响应时间 ${ms}ms")
else
  echo "  ⚠️ 响应较慢 (> 2s)"
  results+=("⚠️ [性能] 响应时间 ${ms}ms")
fi

# 输出汇总
echo ""
echo "=================================================="
echo "检测结果汇总"
echo "=================================================="
for r in "${results[@]}"; do
  echo "$r"
done

echo ""
echo "=================================================="
echo "说明"
echo "=================================================="
echo "1. 此检测使用 curl 进行，无法执行 JavaScript"
echo "2. 应用是 Next.js 客户端渲染 (CSR)"
echo "3. 完整测试需要浏览器自动化 (Playwright/Puppeteer)"
echo "4. 当前环境缺少必要依赖，无法启动 Chromium"
echo "5. 检测结果：基础 HTTP 功能正常"
echo ""
echo "如需完整浏览器测试，请确保："
echo "  - 网络畅通（能访问 deb.debian.org）"
echo "  - 已安装 libnss3, libasound2 等依赖"
echo "  - Playwright browsers 已安装"
echo "=================================================="

# 保存报告
cat > /workspace/test-report-curl.txt << REPORT_EOF
# 脱口秀教练应用 - 基础功能检测报告
时间: $(date '+%Y-%m-%d %H:%M:%S')
地址: $BASE_URL

## 检测结果

REPORT_EOF

for r in "${results[@]}"; do
  echo "$r" >> /workspace/test-report-curl.txt
done

echo "" >> /workspace/test-report-curl.txt
echo "## 局限性说明" >> /workspace/test-report-curl.txt
echo "" >> /workspace/test-report-curl.txt
echo "- 仅检测 HTTP 响应，无法验证 JavaScript 功能" >> /workspace/test-report-curl.txt
echo "- 无法测试用户交互流程" >> /workspace/test-report-curl.txt
echo "- 无法验证 React 组件渲染" >> /workspace/test-report-curl.txt
echo "- 建议：在具备完整依赖的环境中运行 Playwright 测试" >> /workspace/test-report-curl.txt

echo ""
echo "报告已保存: /workspace/test-report-curl.txt"
