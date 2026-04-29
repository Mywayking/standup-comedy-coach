#!/bin/bash

# 「手把手教你玩脱口秀」项目初始化脚本

echo "🎤 初始化脱口秀创作教练项目..."

# 创建项目目录结构
mkdir -p app/create/{material,diagnosis,premise,angle,punchline,draft}
mkdir -p app/projects
mkdir -p app/api/{diagnosis,premise,angle,punchline,script}
mkdir -p components/{ui,cards,steps,layout}
mkdir -p lib/{ai,db,prompts,utils}
mkdir -p store
mkdir -p types
mkdir -p prisma
mkdir -p docs

echo "✅ 目录结构创建完成"
echo ""
echo "下一步："
echo "1. npm install"
echo "2. npx prisma generate"
echo "3. npm run dev"
