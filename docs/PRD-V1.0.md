# 「手把手教你玩脱口秀」产品需求文档 (PRD)

**版本：** V1.0
**状态：** 初稿
**最后更新：** 2026-04-29

---

## 1. 产品概述

### 1.1 产品定位

「手把手教你玩脱口秀」是一款 AI 脱口秀创作教练产品，帮助用户从一个生活素材出发，经过系统化引导，最终形成一段可以上台测试的 1 分钟脱口秀稿。

**核心差异：** 不是 AI 段子生成器，而是 AI 创作陪练——AI 通过分步骤引导、卡片候选、用户选择和持续追问，陪用户一步步完成创作。

### 1.2 产品 slogan

> **"让你的生活素材，变成上台的段子"**

---

## 2. 目标用户画像

| 维度 | 描述 |
|------|------|
| **核心用户** | 25-40 岁都市白领，有表达欲但缺乏脱口秀创作方法 |
| **次要用户** | 脱口秀新人（参加过开放麦<5次） |
| **学习动机** | 想把日常吐槽变成可讲的故事 / 想开发个人风格 / 想系统学习喜剧创作 |
| **技术背景** | 无需编程基础，会用手机 App 即可 |
| **使用场景** | 通勤路上、午休时间、睡前碎片化使用 |

---

## 3. MVP 功能列表

| # | 功能模块 | 功能点 | 优先级 |
|---|----------|--------|--------|
| 1 | 素材输入 | 用户输入一段生活素材（文字，100-500字） | P0 |
| 2 | 素材诊断 | AI 分析素材的冲突、情绪、可笑点、适合风格，输出结构化诊断卡 | P0 |
| 3 | 前提生成 | 基于诊断结果，AI 生成 3-5 个「前提卡片」供用户选择 | P0 |
| 4 | 角度发散 | 基于用户选择的前提，AI 生成 3-5 个「角度卡片」供用户选择 | P0 |
| 5 | 包袱生成 | 基于用户选择的视角，AI 生成多个「包袱零件」供用户选择/编辑 | P0 |
| 6 | 草稿组装 | 用户选择的包袱自动/手动排列组合，形成草稿 | P0 |
| 7 | 稿子生成 | AI 将草稿组合成 1 分钟开放麦稿（500-800字） | P0 |
| 8 | 项目保存 | 所有创作自动保存为「段子项目」，支持查看历史 | P0 |
| 9 | 状态提示 | 每一步显示明确的状态（loading/success/failed/retry/saved） | P0 |
| 10 | 进度指示 | 用户始终知道当前在哪一步、下一步是什么 | P0 |

---

## 4. 创作流程状态机

```
[素材输入] → [素材诊断] → [前提选择] → [角度选择] → [包袱选择] → [草稿组装] → [稿子生成] → [完成]
     ↓            ↓            ↓            ↓            ↓            ↓           ↓
  ERROR       ERROR        ERROR        ERROR        ERROR        ERROR      ERROR
```

**状态说明：**
- `loading` — AI 正在分析/生成，显示骨架屏或进度动画
- `success` — 生成成功，显示结果卡片
- `failed` — 生成失败，显示错误原因和重试按钮
- `retry` — 用户主动重试
- `saved` — 内容已自动保存，显示保存提示

---

## 5. 页面列表

| # | 页面名称 | 路由 | 功能描述 |
|---|----------|------|----------|
| 1 | 首页/开始页 | `/` | 开始创作入口，显示历史项目入口 |
| 2 | 素材输入页 | `/create/material` | 用户输入生活素材 |
| 3 | 诊断结果页 | `/create/diagnosis` | 显示 AI 诊断卡片，支持重新诊断 |
| 4 | 前提选择页 | `/create/premise` | 显示 3-5 个前提卡片，用户选择 |
| 5 | 角度选择页 | `/create/angle` | 显示 3-5 个角度卡片，用户选择 |
| 6 | 包袱选择页 | `/create/punchline` | 显示多个包袱零件卡片，用户勾选 |
| 7 | 草稿组装页 | `/create/draft` | 调整包袱顺序，预览草稿 |
| 8 | 稿子生成页 | `/create/result` | AI 组合成最终稿，用户可编辑 |
| 9 | 项目列表页 | `/projects` | 查看所有历史段子项目 |
| 10 | 项目详情页 | `/projects/:id` | 查看单个项目的完整创作过程 |

---

## 6. 数据结构

### 6.1 段子项目 (Project)

```typescript
interface Project {
  id: string;              // UUID
  created_at: string;     // ISO 时间戳
  updated_at: string;     // ISO 时间戳
  
  // 素材
  material: {
    content: string;      // 用户输入的原始素材
    word_count: number;   // 字数
  };
  
  // 诊断结果
  diagnosis: Diagnosis | null;
  
  // 创作过程
  premise_id: string | null;     // 选择的前提 ID
  angle_id: string | null;       // 选择的视角 ID
  selected_punchline_ids: string[]; // 选择的包袱 ID 列表
  
  // 草稿和稿子
  draft: Punchline[];            // 排列后的包袱列表
  final_script: string | null;   // AI 生成的最终稿
  
  // 状态
  status: 'draft' | 'completed';
  current_step: StepType;        // 当前步骤
}
```

---

## 7. 技术规范

### 7.1 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 前端框架 | Next.js 14 (App Router) | SSR + 客户端渲染 |
| UI 组件 | Tailwind CSS + Headless UI | 原子化 CSS |
| 状态管理 | Zustand | 轻量状态管理 |
| 数据库 | SQLite (开发) / PostgreSQL (生产) | 通过 Prisma ORM |
| AI | OpenAI API (GPT-4o) | 支持模型切换 |

### 7.2 目录结构

```
/
├── app/
│   ├── page.tsx                    # 首页
│   ├── create/
│   │   ├── material/page.tsx
│   │   ├── diagnosis/page.tsx
│   │   ├── premise/page.tsx
│   │   ├── angle/page.tsx
│   │   ├── punchline/page.tsx
│   │   ├── draft/page.tsx
│   │   └── result/page.tsx
│   ├── projects/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   └── api/
│       ├── diagnosis/route.ts
│       ├── premise/route.ts
│       ├── angle/route.ts
│       ├── punchline/route.ts
│       └── script/route.ts
├── components/
│   ├── ui/
│   ├── cards/
│   ├── steps/
│   └── layout/
├── lib/
│   ├── ai/
│   ├── db/
│   ├── prompts/
│   └── utils/
├── store/
│   └── project-store.ts
├── types/
│   └── index.ts
└── prisma/
    └── schema.prisma
```

---

## 8. 里程碑

| 阶段 | 状态 |
|------|------|
| Phase 1: PRD | ✅ 完成 |
| Phase 2: 页面原型 | 🔜 待开始 |
| Phase 3: 技术架构 | 🔜 待开始 |
| Phase 4: 静态 Demo | 🔜 待开始 |
| Phase 5: 数据持久化 | 🔜 待开始 |
| Phase 6: AI 接入 | 🔜 待开始 |
| Phase 7: 测试与修复 | 🔜 待开始 |
