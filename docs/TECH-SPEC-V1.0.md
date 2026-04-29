# 「手把手教你玩脱口秀」技术架构文档 V1.0

**版本：** V1.0
**状态：** 技术方案评审稿
**基于：** PRD-V1.1 + PROTOTYPE-V1.0 + 产品决策确认
**最后更新：** 2026-04-29
**本轮目标：** 将产品需求转化为可开发的技术方案，为静态 Demo 和真实 AI 接入做准备

---

## 目录

1. [技术栈选择](#1-技术栈选择)
2. [项目目录结构](#2-项目目录结构)
3. [核心数据模型](#3-核心数据模型)
4. [API 接口设计](#4-api-接口设计)
5. [AI Agent 技术设计](#5-ai-agent-技术设计)
6. [前端状态管理设计](#6-前端状态管理设计)
7. [自动保存技术方案](#7-自动保存技术方案)
8. [路由与流程保护](#8-路由与流程保护)
9. [错误处理规范](#9-错误处理规范)
10. [静态 Demo 开发计划](#10-静态-demo-开发计划)
11. [测试计划](#11-测试计划)
12. [进入静态-demo-前需要确认的问题](#12-进入静态-demo-前需要确认的问题)

---

## 1. 技术栈选择

### 1.1 技术栈总览

| 层级 | 选择 | 备选 | 决策原因 |
|------|------|------|----------|
| **前端框架** | Next.js (App Router) | — | 文件路由天然匹配页面流、SSR/SSG 支持、API Routes 内置、与 Vercel 部署无缝 |
| **UI 方案** | Tailwind CSS + Headless UI | shadcn/ui | 快速开发 MVP、自定义程度高、Headless UI 提供无障碍交互组件 |
| **状态管理** | Zustand | Redux Toolkit | 轻量（无 boilerplate）、支持 persist 中间件（天然对接 localStorage）、TypeScript 友好 |
| **数据持久化** | localStorage（前端）+ Supabase（后端） | — | MVP 先做本地存储减少复杂度；Supabase 提供 Postgres + Auth + Realtime，MVP 够用且后续可扩展 |
| **后端/API 方案** | Next.js API Routes（服务端） + Supabase Edge Functions（AI 调用） | — | 统一代码库，减少基础设施成本；AI 调用走 Edge Functions 避免 Next.js 超时限制 |
| **ORM** | Prisma | Drizzle ORM | Schema -first 设计、自动生成类型、迁移工具成熟、社区活跃 |
| **数据库** | PostgreSQL（Supabase Hosted） | — | 关系型数据模型友好、JSONB 支持半结构化数据（metadata）、Supabase 免费额度充足 |
| **AI SDK** | OpenAI SDK（官方） | — | GPT-4o 能力强、SDK 稳定、生态成熟 |
| **表单校验** | Zod | Yup / Joi | TypeScript 原生、支持 schema inference、轻量 |
| **测试方案** | Vitest（单元）+ Playwright（E2E） | — | Vitest 快、配置简单；Playwright 跨端（Web + 移动端模拟）|
| **部署方案** | Vercel（前端 + API） + Supabase（数据库） | — | Vercel 与 Next.js 同家，零配置部署；Supabase 提供免费 PostgreSQL |

### 1.2 技术选型理由详述

#### 前端框架：Next.js App Router

- **页面路由 = 文件结构**：创作流程的 6 个页面天然对应 6 个 route segment，不需要额外配置路由表
- **服务端组件**：项目列表、详情页可用 Server Components 直接查询数据库，减少客户端 JS
- **Loading/Error 文件**：内置支持 loading.tsx / error.tsx，对应 AI 生成中的 loading 和 failed 状态，无需手动管理
- **API Routes**：轻量 API 无需单独部署服务

#### UI：Tailwind CSS + Headless UI

- **Tailwind**：原子化 CSS，开发速度快；响应式前缀（sm/md/lg）轻松实现移动端优先
- **Headless UI**：Dialog（弹窗）、Listbox（选择器）、Transition（动画）等复杂交互组件，无需绑定样式

#### 状态管理：Zustand + persist

```typescript
// 示例：自动保存天然集成
const useProjectStore = create(
  persist(
    (set, get) => ({
      currentProject: null,
      saveDraft: (content) => set({ draftContent: content }),
      // ...
    }),
    { name: 'standup-draft' } // localStorage key
  )
)
```

- **persist 中间件**：自动将 store 同步到 localStorage，页面刷新恢复零配置
- ** selectors**：组件只订阅需要的 state 片段，避免不必要的 re-render

#### 数据库：Supabase PostgreSQL

- **JSONB**：WorkflowCard.metadata 用 JSONB 存储半结构化数据（why_it_works / coach_tip / next_question），无需预定义列
- **Row Level Security**：后期加 Auth 后可快速实现用户数据隔离
- **Realtime**（未来）：创作过程可多人围观

#### AI 调用：Supabase Edge Functions

- **无冷启动**：Edge Runtime 冷启动 < 100ms
- **不占用 Next.js 30s 超时**：AI 生成可能耗时较长，Edge Function 可运行更久
- **环境变量管理**：AI API Key 放在 Edge Function 环境变量，不暴露在客户端

#### ORM：Prisma

```prisma
model Project {
  id        String   @id @default(cuid())
  title     String?
  status    String   @default("in_progress") // in_progress | completed
  material  Json?    // { content: string }
  diagnosis Json?     // Diagnosis JSON
  premiseId String?
  angleId   String?
  // ...
}
```

- **类型安全**：Prisma Client 自动生成 TypeScript 类型，API 和前端共享同一套类型定义
- **迁移版本控制**：prisma/migrations/ 记录每次 schema 变更

### 1.3 技术栈依赖关系图

```
┌─────────────────────────────────────────────────────────┐
│                     用户浏览器                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Next.js App  │  │   Zustand    │  │  TailwindCSS  │  │
│  │  (React)     │  │   Store      │  │     UI        │  │
│  │              │  │              │  │               │  │
│  │ - Pages/     │  │ - current    │  │ - components/ │  │
│  │   Routes     │  │   project    │  │ - layouts/    │  │
│  │ - API Routes │  │ - draft      │  │ - states/     │  │
│  │ - Loading/   │  │   material   │  │               │  │
│  │   Error      │  │ - selections │  │               │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────────┘  │
│         │                 │                               │
│         │ HTTP/REST       │ localStorage (persist)        │
│         ▼                 ▼                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Supabase PostgreSQL                   │   │
│  │  - Projects, WorkflowCards, AITaskLogs            │   │
│  │  - UserSettings, AgentConfig                       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Supabase Edge Functions                  │   │
│  │  - material_diagnosis (AI 调用)                   │   │
│  │  - premise_generator (AI 调用)                    │   │
│  │  - angle_generator (AI 调用)                      │   │
│  │  - punchline_generator (AI 调用)                  │   │
│  │  - script_composer (AI 调用)                     │   │
│  │  - recommend_card (轻量推荐)                      │   │
│  │                                                    │   │
│  │  调用 OpenAI SDK → GPT-4o                         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ OpenAI API
                          ▼
                  ┌───────────────┐
                  │  OpenAI API   │
                  │  (GPT-4o)     │
                  └───────────────┘
```

---

## 2. 项目目录结构

```
standup-comedy-coach/
├── prisma/                          # 数据库 schema 和迁移
│   ├── schema.prisma                # Prisma 数据模型定义
│   └── migrations/                  # 迁移历史
│
├── src/
│   ├── app/                         # Next.js App Router（页面 + API）
│   │   ├── layout.tsx               # 根布局（全局样式、Provider）
│   │   ├── page.tsx                 # 首页 / 工作台
│   │   ├── globals.css              # 全局样式（Tailwind 入口）
│   │   │
│   │   ├── create/                  # 创作流程路由组
│   │   │   ├── layout.tsx           # 创作流程共享布局（进度条）
│   │   │   ├── material/
│   │   │   │   └── page.tsx         # 素材输入页
│   │   │   ├── diagnosis/
│   │   │   │   └── page.tsx         # 诊断结果页
│   │   │   ├── premise/
│   │   │   │   └── page.tsx         # 前提选择页
│   │   │   ├── angle/
│   │   │   │   └── page.tsx         # 角度选择页
│   │   │   ├── punchline/
│   │   │   │   └── page.tsx         # 包袱选择页
│   │   │   └── draft/
│   │   │       └── page.tsx         # 草稿生成页
│   │   │
│   │   ├── projects/                # 项目管理
│   │   │   ├── page.tsx             # 项目列表页
│   │   │   └── [id]/
│   │   │       └── page.tsx          # 项目详情页
│   │   │
│   │   ├── settings/
│   │   │   └── page.tsx             # 设置页
│   │   │
│   │   └── api/                     # API Routes（后端接口）
│   │       ├── projects/
│   │       │   ├── route.ts          # POST 创建项目 / GET 列表
│   │       │   └── [id]/
│   │       │       └── route.ts      # GET 项目详情 / PATCH 更新 / DELETE
│   │       │
│   │       ├── cards/
│   │       │   ├── route.ts          # POST 创建卡片
│   │       │   └── [id]/
│   │       │       └── route.ts      # PATCH 更新卡片 / 收藏 / 编辑
│   │       │
│   │       ├── ai/                   # AI 生成相关
│   │       │   ├── diagnosis/
│   │       │   │   └── route.ts      # POST 生成素材诊断
│   │       │   ├── premise/
│   │       │   │   └── route.ts      # POST 生成前提
│   │       │   ├── angle/
│   │       │   │   └── route.ts      # POST 生成角度
│   │       │   ├── punchline/
│   │       │   │   └── route.ts      # POST 生成包袱
│   │       │   ├── draft/
│   │       │   │   └── route.ts      # POST 生成草稿
│   │       │   ├── regenerate/
│   │       │   │   └── route.ts      # POST 重新生成（接受 step_type）
│   │       │   └── recommend/
│   │       │       └── route.ts      # POST 帮我推荐卡片
│   │       │
│   │       └── autosave/
│   │           └── route.ts          # POST 自动保存素材
│   │
│   ├── components/                  # React 组件
│   │   ├── ui/                       # 基础 UI 组件（原子级）
│   │   │   ├── Button.tsx           # 按钮（primary/secondary/ghost/danger）
│   │   │   ├── Card.tsx             # 卡片容器
│   │   │   ├── ProgressBar.tsx      # 进度条（创作流程）
│   │   │   ├── Toast.tsx            # Toast 提示
│   │   │   ├── Modal.tsx            # 模态框
│   │   │   ├── Textarea.tsx         # 大文本输入框
│   │   │   ├── Badge.tsx            # 标签（小圆角标签）
│   │   │   ├── Skeleton.tsx         # 骨架屏
│   │   │   ├── Spinner.tsx          # 加载指示器
│   │   │   └── Divider.tsx          # 分隔线
│   │   │
│   │   ├── layout/                   # 布局组件
│   │   │   ├── AppShell.tsx         # 移动端容器（max-w-md mx-auto）
│   │   │   ├── Header.tsx           # 顶部导航（← + 标题）
│   │   │   ├── Footer.tsx           # 底部操作区（主 CTA）
│   │   │   ├── WorkflowProgress.tsx # 创作流程进度条
│   │   │   └── ConfirmDialog.tsx    # 确认对话框（取消生成时用）
│   │   │
│   │   ├── workflow/                 # 创作流程页面的区块组件
│   │   │   ├── MaterialInput.tsx   # 素材输入区块
│   │   │   ├── DiagnosisResult.tsx # 诊断结果展示区块
│   │   │   ├── PremiseSelector.tsx  # 前提选择区块
│   │   │   ├── AngleSelector.tsx    # 角度选择区块
│   │   │   ├── PunchlineSelector.tsx # 包袱选择区块
│   │   │   ├── DraftEditor.tsx     # 草稿编辑区块
│   │   │   ├── DraftPreview.tsx   # 草稿预览区块
│   │   │   └── CoachReview.tsx      # 教练点评区块
│   │   │
│   │   ├── cards/                    # 卡片组件（核心复用单元）
│   │   │   ├── BaseCard.tsx         # 卡片基础容器（选中态/收藏态/编辑态/loading态/failed态）
│   │   │   ├── PremiseCard.tsx      # 前提卡片（基于 BaseCard）
│   │   │   ├── AngleCard.tsx        # 角度卡片（基于 BaseCard + 潜力标签）
│   │   │   ├── PunchlineCard.tsx    # 包袱卡片（基于 BaseCard + 类型标签 + 上移/下移按钮）
│   │   │   ├── DiagnosisCard.tsx     # 诊断摘要卡片
│   │   │   ├── CoachTipCard.tsx     # 教练点评卡片
│   │   │   └── DraftCard.tsx        # 草稿展示卡片
│   │   │
│   │   ├── coach/                    # 教练感组件
│   │   │   ├── CoachTipBadge.tsx    # 教练提示徽章
│   │   │   ├── CoachTipPanel.tsx    # 可折叠的教练提示面板
│   │   │   ├── WhyItWorks.tsx       # 💡 为什么选这个
│   │   │   ├── NextQuestion.tsx     # 📌 试试想想
│   │   │   ├── HelpRecommend.tsx    # 🤔 帮我推荐弹窗
│   │   │   └── CoachGuide.tsx       # 页面顶部的教练引导语
│   │   │
│   │   ├── projects/                 # 项目相关组件
│   │   │   ├── ProjectCard.tsx      # 项目列表卡片
│   │   │   ├── ProjectTimeline.tsx  # 项目详情时间轴
│   │   │   └── ProjectActions.tsx   # 项目操作按钮组
│   │   │
│   │   └── status/                   # 状态组件
│   │       ├── LoadingState.tsx     # AI 生成中状态（分步骤进度）
│   │       ├── FailedState.tsx      # 失败状态（错误信息 + 重试按钮）
│   │       ├── SavingState.tsx       # 保存中状态（Toast）
│   │       ├── EmptyState.tsx        # 空列表状态
│   │       └── InsufficientState.tsx # 素材不足状态（字数 < 30）
│   │
│   ├── lib/                          # 工具库
│   │   ├── db.ts                     # Prisma Client 初始化
│   │   ├── supabase.ts               # Supabase Client 初始化
│   │   ├── openai.ts                 # OpenAI Client 初始化
│   │   ├── zod-schemas.ts           # Zod 表单校验 schemas
│   │   ├── json-parser.ts           # AI JSON 解析工具（含 fallback）
│   │   ├── debounce.ts               # 防抖工具
│   │   ├── retry.ts                  # 重试工具（指数退避）
│   │   └── utils.ts                  # 通用工具函数（formatDate / truncate 等）
│   │
│   ├── prompts/                      # AI Prompt 模板
│   │   ├── diagnosis.ts              # 素材诊断 prompt
│   │   ├── premise.ts                # 前提生成 prompt
│   │   ├── angle.ts                  # 角度生成 prompt
│   │   ├── punchline.ts              # 包袱生成 prompt
│   │   ├── draft.ts                  # 草稿组合 prompt
│   │   └── recommend.ts              # 帮我推荐 prompt
│   │
│   ├── agents/                       # AI Agent 封装
│   │   ├── base.ts                   # Agent 基类（输入校验 → 调用 prompt → JSON 解析 → 保存 WorkflowCard → 写入 AITaskLog）
│   │   ├── materialDiagnosis.ts     # material_diagnosis_agent
│   │   ├── premiseGenerator.ts      # premise_generator_agent
│   │   ├── angleGenerator.ts        # angle_generator_agent
│   │   ├── punchlineGenerator.ts    # punchline_generator_agent
│   │   ├── scriptComposer.ts        # script_composer_agent
│   │   └── recommendAgent.ts        # 帮我推荐 agent（轻量）
│   │
│   ├── store/                        # Zustand 状态管理
│   │   ├── projectStore.ts          # 当前项目状态（currentProject / currentStep / selections）
│   │   ├── cardStore.ts             # 卡片状态（cards / selected / favorite / editing）
│   │   ├── draftStore.ts            # 草稿状态（finalScript / wordCount / editing）
│   │   ├── uiStore.ts               # UI 状态（loading / failed / autoSaving / coachTipVisible）
│   │   └── settingsStore.ts         # 用户设置状态
│   │
│   ├── types/                        # TypeScript 类型定义
│   │   ├── project.ts               # Project 相关类型
│   │   ├── workflow.ts              # WorkflowCard / Step 相关类型
│   │   ├── ai.ts                   # AI 请求/响应类型（AITaskLog / AgentConfig）
│   │   ├── api.ts                  # API 请求/响应类型
│   │   ├── settings.ts             # UserSettings 类型
│   │   └── index.ts                # 统一导出
│   │
│   └── hooks/                        # React 自定义 Hooks
│       ├── useAutoSave.ts           # 素材自动保存 hook
│       ├── useCardSelection.ts      # 卡片选择 hook
│       ├── useProject.ts            # 项目 CRUD hook
│       ├── useAICall.ts             # AI 调用 hook（loading/failed/retry 封装）
│       ├── useLocalRestore.ts       # 页面刷新恢复 hook
│       └── useDebounce.ts           # 防抖 hook
│
├── public/                           # 静态资源
│   ├── favicon.ico
│   └── images/
│
├── tests/                            # 测试文件
│   ├── e2e/                          # Playwright E2E 测试
│   │   ├── main-flow.spec.ts        # 主流程 E2E
│   │   ├── card-interaction.spec.ts # 卡片交互测试
│   │   ├── auto-save.spec.ts        # 自动保存测试
│   │   ├── navigation.spec.ts       # 返回/导航测试
│   │   └── loading-state.spec.ts    # loading/failed 状态测试
│   │
│   └── unit/                        # Vitest 单元测试
│       ├── json-parser.test.ts      # JSON 解析测试
│       ├── debounce.test.ts         # 防抖测试
│       ├── retry.test.ts            # 重试逻辑测试
│       └── zod-schemas.test.ts      # 表单校验测试
│
├── .env.local                        # 本地环境变量（不提交）
│   ├── OPENAI_API_KEY=
│   ├── SUPABASE_URL=
│   └── SUPABASE_ANON_KEY=
│
├── .env.example                      # 环境变量示例（提交到 Git）
│
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts                  # Vitest 配置
├── playwright.config.ts              # Playwright 配置
├── next.config.js
├── README.md
└── SPEC.md                           # 软链接到 docs/SPEC.md（项目根目录）
```

---

## 3. 核心数据模型

### 3.1 数据库 Schema（Prisma）

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// Project — 段子创作项目
// ============================================================
model Project {
  id              String          @id @default(cuid())
  title           String?                           // 项目标题（可从素材提取，未必填）
  status          String          @default("in_progress") // in_progress | completed
  material        Json?                             // { content: string }
  diagnosis       Json?                             // Diagnosis JSON（来自 AI 诊断）
  premiseId       String?                           // 用户选中的前提卡片 ID
  angleId         String?                           // 用户选中的角度卡片 ID
  selectedPunchlineIds Json?                        // string[] 用户选中的包袱 ID 数组
  finalScript     String?                           // 最终稿正文
  wordCountFinal  Int?                              // 最终稿字数
  durationFinal   Int?                              // 最终稿预估时长（秒）
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  // 关系
  cards           WorkflowCard[]
  taskLogs        AITaskLog[]

  @@index([status])
  @@index([createdAt])
}

// ============================================================
// WorkflowCard — 创作流程中所有 AI 生成和用户编辑的卡片
// ============================================================
model WorkflowCard {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  stepType    String   // premise | angle | punchline
  title       String?                      // 卡片标题（如前提名称）
  content     String?                      // 卡片正文（段子内容 / 描述文本）
  metadata    Json?                        // { why_it_works, coach_tip, next_question, tags, type_tag, placement, potential_label, conflict, emotion, why_this_works }
  
  // 状态标记
  selected    Boolean   @default(false)   // 是否被用户选中
  favorite    Boolean   @default(false)   // 是否被收藏
  editable    Boolean   @default(false)    // 是否在编辑模式
  
  // 顺序（仅 punchline 多选时有意义）
  order       Int       @default(0)        // 在选中列表中的序号（0 = 未选中）

  // 来源
  createdBy   String    @default("ai")     // ai | user

  // 版本
  version     Int       @default(1)        // 版本号（重新生成时递增）
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([projectId, stepType])
  @@index([projectId, selected])
  @@index([projectId, favorite])
}

// ============================================================
// AITaskLog — AI 任务执行日志
// ============================================================
model AITaskLog {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  agentType   String   // material_diagnosis | premise_generator | angle_generator | punchline_generator | script_composer | recommend
  stepType    String?  // premise | angle | punchline | draft（与 agentType 有对应关系）
  
  // 输入
  inputPayload  Json?   // 请求参数（material content / selected premise / etc.）
  
  // 输出
  rawOutput    String?  // AI 原始返回（未解析）
  parsedOutput Json?    // 解析后的 JSON
  outputCardId String?  // 关联的 WorkflowCard ID（如果有）

  // 执行情况
  status      String   @default("success") // success | failed | timeout | json_parse_error
  errorMsg    String?
  retryCount  Int      @default(0)
  latencyMs   Int?     // 耗时毫秒数
  
  createdAt   DateTime @default(now())

  @@index([projectId, agentType])
  @@index([projectId, createdAt])
}

// ============================================================
// AgentConfig — AI Agent 配置（提示词版本管理 / 模型参数）
// ============================================================
model AgentConfig {
  id          String   @id @default(cuid())
  agentType   String   @unique // material_diagnosis | premise_generator | angle_generator | punchline_generator | script_composer | recommend

  model       String   @default("gpt-4o")         // 模型名称
  temperature Float    @default(0.7)
  maxTokens   Int      @default(2048)
  topP        Float    @default(1.0)

  // prompt 模板版本
  promptTemplate String                    // prompt 模板文本
  promptVersion  Int      @default(1)      // 模板版本号
  
  // 其他参数
  extraParams   Json?                      // { timeout_ms, stop_sequences, ... }

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ============================================================
// UserSettings — 用户设置
// ============================================================
model UserSettings {
  id          String   @id @default(cuid())
  
  // 创作偏好
  targetDuration String @default("1min")  // 目标时长：30s | 1min | 2min | 3min
  aiModel     String   @default("gpt-4o-mini")
  
  // 数据管理
  exportLastAt DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 3.2 TypeScript 类型定义

```typescript
// types/project.ts

export type ProjectStatus = 'in_progress' | 'completed'

export interface Material {
  content: string
}

export interface Diagnosis {
  summary: string
  conflict: {
    label: string
    description: string
    why_this_works: string
  }
  emotion: {
    primary: string
    secondary: string[]
  }
  comedicPotential: number // 1-5 星
  estimatedLength: string // "约 45 秒" | "约 1 分钟"
}

export interface Project {
  id: string
  title: string | null
  status: ProjectStatus
  material: Material | null
  diagnosis: Diagnosis | null
  premiseId: string | null
  angleId: string | null
  selectedPunchlineIds: string[] | null
  finalScript: string | null
  wordCountFinal: number | null
  durationFinal: number | null
  createdAt: string
  updatedAt: string
}
```

```typescript
// types/workflow.ts

export type StepType = 'premise' | 'angle' | 'punchline'
export type CreatedBy = 'ai' | 'user'

export interface CardMetadata {
  // 通用
  why_it_works?: string
  coach_tip?: string
  next_question?: string
  tags?: string[]

  // 诊断独有
  conflict?: {
    label: string
    description: string
    why_this_works: string
  }
  emotion?: {
    primary: string
    secondary: string[]
  }
  comedic_potential?: number

  // 前提/角度独有
  description?: string
  potential_label?: 'high' | 'medium' | 'low'

  // 包袱独有
  type_tag?: '铺垫' | '包袱' | 'Tag' | 'call-back' | '转场'
  placement?: '前面' | '中间' | '后面'
  why_this_works?: string
}

export interface WorkflowCard {
  id: string
  projectId: string
  stepType: StepType
  title: string | null
  content: string | null
  metadata: CardMetadata | null
  selected: boolean
  favorite: boolean
  editable: boolean
  order: number
  createdBy: CreatedBy
  version: number
  createdAt: string
  updatedAt: string
}

export type WorkflowStep = 
  | 'material'   // 素材输入
  | 'diagnosis'  // 诊断结果（无对应卡片）
  | 'premise'    // 前提选择
  | 'angle'      // 角度选择
  | 'punchline'  // 包袱选择
  | 'draft'      // 草稿生成

// 步骤顺序映射
export const WORKFLOW_STEPS: WorkflowStep[] = [
  'material', 'diagnosis', 'premise', 'angle', 'punchline', 'draft'
]

// 进度条步骤（不含 diagnosis）
export const PROGRESS_STEPS: WorkflowStep[] = [
  'material', 'premise', 'angle', 'punchline', 'draft'
]
```

```typescript
// types/ai.ts

export type AgentType = 
  | 'material_diagnosis'
  | 'premise_generator'
  | 'angle_generator'
  | 'punchline_generator'
  | 'script_composer'
  | 'recommend'

export type TaskStatus = 'success' | 'failed' | 'timeout' | 'json_parse_error'

export interface AITaskLog {
  id: string
  projectId: string
  agentType: AgentType
  stepType: string | null
  inputPayload: Record<string, unknown> | null
  rawOutput: string | null
  parsedOutput: Record<string, unknown> | null
  outputCardId: string | null
  status: TaskStatus
  errorMsg: string | null
  retryCount: number
  latencyMs: number | null
  createdAt: string
}

export interface AgentConfig {
  id: string
  agentType: AgentType
  model: string
  temperature: number
  maxTokens: number
  topP: number
  promptTemplate: string
  promptVersion: number
  extraParams: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}
```

```typescript
// types/settings.ts

export type TargetDuration = '30s' | '1min' | '2min' | '3min'

export interface UserSettings {
  id: string
  targetDuration: TargetDuration
  aiModel: string
  exportLastAt: string | null
  createdAt: string
  updatedAt: string
}
```

```typescript
// types/api.ts

// ========== Projects ==========
export interface CreateProjectRequest {
  material?: { content: string }
}

export interface CreateProjectResponse {
  project: Project
}

export interface GetProjectListResponse {
  projects: Project[]
}

export interface GetProjectDetailResponse {
  project: Project
  cards: WorkflowCard[]
}

export interface UpdateProjectRequest {
  title?: string
  status?: ProjectStatus
  material?: Material
  diagnosis?: Diagnosis
  premiseId?: string | null
  angleId?: string | null
  selectedPunchlineIds?: string[] | null
  finalScript?: string | null
  wordCountFinal?: number | null
  durationFinal?: number | null
}

export interface DeleteProjectResponse {
  success: boolean
}

// ========== Cards ==========
export interface CreateCardRequest {
  projectId: string
  stepType: StepType
  cards: Array<{
    title?: string
    content?: string
    metadata?: CardMetadata
    createdBy?: CreatedBy
  }>
}

export interface UpdateCardRequest {
  title?: string
  content?: string
  metadata?: CardMetadata
  selected?: boolean
  favorite?: boolean
  editable?: boolean
  order?: number
}

export interface SelectCardRequest {
  selected: boolean
  stepType: StepType
  // 如果是 punchline，还要传顺序
  order?: number
}

export interface FavoriteCardRequest {
  favorite: boolean
}

export interface EditCardRequest {
  content: string
}

export interface RegenerateRequest {
  stepType: StepType
  projectId: string
  // 可选：基于上下文（如选了前提则重新生成角度）
  context?: {
    premiseId?: string
    angleId?: string
    selectedPunchlineIds?: string[]
  }
}

export interface RecommendRequest {
  projectId: string
  stepType: StepType // 'premise' | 'angle'
  existingCards: WorkflowCard[]
}

// ========== AI ==========
export interface DiagnoseMaterialRequest {
  projectId: string
  material: Material
}

export interface GeneratePremiseRequest {
  projectId: string
  diagnosis: Diagnosis
}

export interface GenerateAngleRequest {
  projectId: string
  diagnosis: Diagnosis
  selectedPremise: WorkflowCard
}

export interface GeneratePunchlineRequest {
  projectId: string
  diagnosis: Diagnosis
  selectedPremise: WorkflowCard
  selectedAngle: WorkflowCard
}

export interface GenerateDraftRequest {
  projectId: string
  selectedPunchlines: WorkflowCard[]
  targetDuration: TargetDuration
}

export interface AICallResponse {
  success: boolean
  data?: Record<string, unknown>
  error?: {
    code: string
    message: string
    retryable: boolean
  }
}

export interface AutosaveRequest {
  projectId?: string // 有 id 则更新，无 id 则创建草稿
  material: Material
}
```

```typescript
// types/index.ts
// 统一导出
export * from './project'
export * from './workflow'
export * from './ai'
export * from './settings'
export * from './api'
```

---

## 4. API 接口设计

### 4.1 项目管理

#### 4.1.1 创建项目

| 项目 | 内容 |
|------|------|
| **method** | `POST` |
| **path** | `/api/projects` |
| **request JSON** | `{ material?: { content: string } }` |
| **response JSON** | `{ project: Project }` |
| **错误码** | `400` 请求参数错误 / `500` 服务器错误 |
| **写入 AITaskLog** | 否 |
| **写入 WorkflowCard** | 否 |

**成功响应：**
```json
{
  "project": {
    "id": "proj_abc123",
    "title": null,
    "status": "in_progress",
    "material": { "content": "上周相亲..." },
    "diagnosis": null,
    "premiseId": null,
    "angleId": null,
    "selectedPunchlineIds": null,
    "finalScript": null,
    "wordCountFinal": null,
    "durationFinal": null,
    "createdAt": "2026-04-29T10:00:00.000Z",
    "updatedAt": "2026-04-29T10:00:00.000Z"
  }
}
```

#### 4.1.2 获取项目列表

| 项目 | 内容 |
|------|------|
| **method** | `GET` |
| **path** | `/api/projects` |
| **query** | `?status=in_progress,completed&limit=20&offset=0` |
| **request JSON** | 无 |
| **response JSON** | `{ projects: Project[], total: number }` |
| **错误码** | `500` 服务器错误 |
| **写入 AITaskLog** | 否 |
| **写入 WorkflowCard** | 否 |

#### 4.1.3 获取项目详情

| 项目 | 内容 |
|------|------|
| **method** | `GET` |
| **path** | `/api/projects/[id]` |
| **request JSON** | 无 |
| **response JSON** | `{ project: Project, cards: WorkflowCard[] }` |
| **错误码** | `404` 项目不存在 / `500` 服务器错误 |
| **写入 AITaskLog** | 否 |
| **写入 WorkflowCard** | 否 |

#### 4.1.4 更新项目

| 项目 | 内容 |
|------|------|
| **method** | `PATCH` |
| **path** | `/api/projects/[id]` |
| **request JSON** | `UpdateProjectRequest`（见类型定义）|
| **response JSON** | `{ project: Project }` |
| **错误码** | `400` 请求参数错误 / `404` 项目不存在 / `500` 服务器错误 |
| **写入 AITaskLog** | 否 |
| **写入 WorkflowCard** | 否 |

#### 4.1.5 删除项目

| 项目 | 内容 |
|------|------|
| **method** | `DELETE` |
| **path** | `/api/projects/[id]` |
| **request JSON** | 无 |
| **response JSON** | `{ success: true }` |
| **错误码** | `404` 项目不存在 / `500` 服务器错误 |
| **写入 AITaskLog** | 否 |
| **写入 WorkflowCard** | 级联删除（onDelete: Cascade）|

---

### 4.2 卡片管理

#### 4.2.1 创建 WorkflowCard

| 项目 | 内容 |
|------|------|
| **method** | `POST` |
| **path** | `/api/cards` |
| **request JSON** | `CreateCardRequest` |
| **response JSON** | `{ cards: WorkflowCard[] }` |
| **错误码** | `400` 请求参数错误 / `404` 项目不存在 / `500` 服务器错误 |
| **写入 AITaskLog** | 否 |
| **写入 WorkflowCard** | 是（批量创建）|

**请求示例：**
```json
{
  "projectId": "proj_abc123",
  "stepType": "premise",
  "cards": [
    {
      "title": "量化委屈",
      "content": "把迟到的时间和金钱损失算清楚",
      "metadata": {
        "why_it_works": "让委屈变成可验证的荒谬",
        "coach_tip": "用数字对比制造荒谬感",
        "next_question": "你能接受的最荒诞的数字对比是什么？",
        "tags": ["人际关系", "量化"]
      }
    }
  ]
}
```

#### 4.2.2 更新 WorkflowCard

| 项目 | 内容 |
|------|------|
| **method** | `PATCH` |
| **path** | `/api/cards/[id]` |
| **request JSON** | `UpdateCardRequest` |
| **response JSON** | `{ card: WorkflowCard }` |
| **错误码** | `400` 请求参数错误 / `404` 卡片不存在 / `500` 服务器错误 |
| **写入 AITaskLog** | 否 |
| **写入 WorkflowCard** | 是（更新单条）|

#### 4.2.3 选择卡片

| 项目 | 内容 |
|------|------|
| **method** | `PATCH` |
| **path** | `/api/cards/[id]/select` |
| **request JSON** | `SelectCardRequest` |
| **response JSON** | `{ card: WorkflowCard, clearedIds?: string[] }` |
| **错误码** | `400` 步骤类型错误 / `404` 卡片不存在 / `500` 服务器错误 |
| **写入 AITaskLog** | 否 |
| **写入 WorkflowCard** | 是（更新 selected + order；如果是单选则先清空同 stepType 的其他 selected）|

**业务逻辑：**
- `premise` / `angle`：单选，清空同 stepType 的其他 selected
- `punchline`：多选，支持 order

**响应示例（punchline 多选）：**
```json
{
  "card": { "id": "card_001", "selected": true, "order": 3, ... },
  "clearedIds": []
}
```

#### 4.2.4 收藏卡片

| 项目 | 内容 |
|------|------|
| **method** | `PATCH` |
| **path** | `/api/cards/[id]/favorite` |
| **request JSON** | `FavoriteCardRequest` |
| **response JSON** | `{ card: WorkflowCard }` |
| **错误码** | `404` 卡片不存在 / `500` 服务器错误 |
| **写入 AITaskLog** | 否 |
| **写入 WorkflowCard** | 是（更新 favorite）|

#### 4.2.5 编辑卡片

| 项目 | 内容 |
|------|------|
| **method** | `PATCH` |
| **path** | `/api/cards/[id]/edit` |
| **request JSON** | `EditCardRequest` |
| **response JSON** | `{ card: WorkflowCard }` |
| **错误码** | `404` 卡片不存在 / `500` 服务器错误 |
| **写入 AITaskLog** | 否 |
| **写入 WorkflowCard** | 是（更新 content + createdBy='user'）|

#### 4.2.6 自动保存素材

| 项目 | 内容 |
|------|------|
| **method** | `POST` |
| **path** | `/api/autosave` |
| **request JSON** | `AutosaveRequest` |
| **response JSON** | `{ project: Project, saved: true }` |
| **错误码** | `400` 请求参数错误 / `500` 服务器错误 |
| **写入 AITaskLog** | 否 |
| **写入 WorkflowCard** | 否（仅更新 Project.material）|

**业务逻辑：**
- 有 `projectId`：更新已有项目的 material
- 无 `projectId`：创建新项目并保存 material（临时草稿，未跳转入创作流程）

---

### 4.3 AI 生成

#### 4.3.1 生成素材诊断

| 项目 | 内容 |
|------|------|
| **method** | `POST` |
| **path** | `/api/ai/diagnosis` |
| **request JSON** | `DiagnoseMaterialRequest` |
| **response JSON** | `{ diagnosis: Diagnosis, project: Project }` |
| **错误码** | `400` 素材太短（< 10字）/ `408` AI 超时 / `422` JSON 解析失败 / `500` 服务器错误 |
| **写入 AITaskLog** | 是 |
| **写入 WorkflowCard** | 否（诊断结果写入 Project.diagnosis，不是卡片）|

**请求示例：**
```json
{
  "projectId": "proj_abc123",
  "material": { "content": "上周相亲，对方迟到半小时..." }
}
```

**响应示例：**
```json
{
  "diagnosis": {
    "summary": "这个素材讲的是你的相亲对象迟到+多占便宜，展现了一种「以自我为中心」的人际模式",
    "conflict": {
      "label": "自我中心 vs 被动吃亏",
      "description": "对方的算计和你的被动接受形成对比",
      "why_this_works": "强弱对比明显，观众会有代入感"
    },
    "emotion": {
      "primary": "委屈",
      "secondary": ["愤怒", "自嘲", "无奈"]
    },
    "comedicPotential": 4,
    "estimatedLength": "约 1 分钟"
  },
  "project": { "id": "proj_abc123", "diagnosis": <Diagnosis>, ... }
}
```

#### 4.3.2 生成前提

| 项目 | 内容 |
|------|------|
| **method** | `POST` |
| **path** | `/api/ai/premise` |
| **request JSON** | `GeneratePremiseRequest` |
| **response JSON** | `{ cards: WorkflowCard[], taskLogId: string }` |
| **错误码** | `400` 缺少诊断结果 / `408` AI 超时 / `422` JSON 解析失败 / `500` 服务器错误 |
| **写入 AITaskLog** | 是 |
| **写入 WorkflowCard** | 是（批量创建 3 张）|

**业务逻辑：**
- 先调用 premise_generator_agent
- 解析 JSON 失败则最多重试 2 次
- 成功后批量创建 3 张 WorkflowCard（stepType='premise', createdBy='ai'）

#### 4.3.3 生成角度

| 项目 | 内容 |
|------|------|
| **method** | `POST` |
| **path** | `/api/ai/angle` |
| **request JSON** | `GenerateAngleRequest` |
| **response JSON** | `{ cards: WorkflowCard[], taskLogId: string }` |
| **错误码** | `400` 缺少诊断或前提 / `408` AI 超时 / `422` JSON 解析失败 / `500` 服务器错误 |
| **写入 AITaskLog** | 是 |
| **写入 WorkflowCard** | 是（批量创建 3 张，stepType='angle'）|

#### 4.3.4 生成包袱

| 项目 | 内容 |
|------|------|
| **method** | `POST` |
| **path** | `/api/ai/punchline` |
| **request JSON** | `GeneratePunchlineRequest` |
| **response JSON** | `{ cards: WorkflowCard[], taskLogId: string }` |
| **错误码** | `400` 缺少诊断/前提/角度 / `408` AI 超时 / `422` JSON 解析失败 / `500` 服务器错误 |
| **写入 AITaskLog** | 是 |
| **写入 WorkflowCard** | 是（批量创建 6 张，stepType='punchline'）|

#### 4.3.5 生成草稿

| 项目 | 内容 |
|------|------|
| **method** | `POST` |
| **path** | `/api/ai/draft` |
| **request JSON** | `GenerateDraftRequest` |
| **response JSON** | `{ project: Project, coachReview: CoachReview, taskLogId: string }` |
| **错误码** | `400` 未选择包袱 / `408` AI 超时 / `422` JSON 解析失败 / `500` 服务器错误 |
| **写入 AITaskLog** | 是 |
| **写入 WorkflowCard** | 否（结果写入 Project.finalScript）|

**CoachReview 类型：**
```typescript
interface CoachReview {
  assessment: string         // 整体评价
  strengths: string[]       // 优点列表
  suggestions: string[]     // 建议列表
  nextStep: string          // 下一步行动建议
}
```

#### 4.3.6 重新生成某一组卡片

| 项目 | 内容 |
|------|------|
| **method** | `POST` |
| **path** | `/api/ai/regenerate` |
| **request JSON** | `RegenerateRequest` |
| **response JSON** | `{ cards: WorkflowCard[], taskLogId: string }` |
| **错误码** | `400` 参数错误 / `408` AI 超时 / `422` JSON 解析失败 / `500` 服务器错误 |
| **写入 AITaskLog** | 是 |
| **写入 WorkflowCard** | 是（先软删除旧卡片，再批量创建新卡片）|

**业务逻辑：**
- `stepType='premise'`：删除所有 premise 卡片，清空 Project.premiseId
- `stepType='angle'`：删除所有 angle 卡片，清空 Project.angleId（同时清空包袱和草稿）
- `stepType='punchline'`：删除所有 punchline 卡片，清空 selectedPunchlineIds（同时清空草稿）
- 新卡片 version = 旧卡片最大 version + 1

#### 4.3.7 帮我推荐卡片

| 项目 | 内容 |
|------|------|
| **method** | `POST` |
| **path** | `/api/ai/recommend` |
| **request JSON** | `RecommendRequest` |
| **response JSON** | `{ recommendedCard: WorkflowCard, reason: string }` |
| **错误码** | `400` 参数错误 / `500` 服务器错误 |
| **写入 AITaskLog** | 是（agentType='recommend'）|
| **写入 WorkflowCard** | 否 |

**推荐逻辑（MVP 简化）：**
- 基于用户素材特征（情绪标签、冲突类型）和卡片元数据（potential_label）做推荐
- 返回推荐卡片 + 原因说明
- **不生成新卡片**，仅从已有卡片中选择

---

### 4.4 API 错误码汇总

| HTTP 状态码 | 业务错误码 | 说明 | 是否可重试 |
|------------|-----------|------|-----------|
| 400 | `INVALID_MATERIAL_TOO_SHORT` | 素材内容少于 10 字 | 否 |
| 400 | `MISSING_DIAGNOSIS` | 缺少诊断结果 | 否 |
| 400 | `MISSING_PREMISE` | 缺少前提选择 | 否 |
| 400 | `NO_PUNCHLINES_SELECTED` | 未选择任何包袱 | 否 |
| 404 | `PROJECT_NOT_FOUND` | 项目不存在 | 否 |
| 404 | `CARD_NOT_FOUND` | 卡片不存在 | 否 |
| 408 | `AI_TIMEOUT` | AI 调用超时（> 30s）| 是 |
| 422 | `JSON_PARSE_ERROR` | AI 返回无法解析为 JSON | 是（最多重试 2 次）|
| 500 | `INTERNAL_ERROR` | 服务器内部错误 | 是 |

---

## 5. AI Agent 技术设计

### 5.1 Agent 基类设计

```typescript
// agents/base.ts

interface AgentOptions<TInput, TOutput> {
  agentType: AgentType
  stepType?: StepType
  inputSchema: ZodSchema<TInput>
  outputSchema: ZodSchema<TOutput>
  maxRetries: number
  timeoutMs: number
}

class BaseAgent<TInput, TOutput> {
  async run(input: TInput): Promise<TOutput> {
    // 1. 输入校验（Zod）
    // 2. 构造 prompt
    // 3. 调用 OpenAI（带超时控制）
    // 4. 解析 JSON
    // 5. 解析失败 → 重试（最多 maxRetries 次）
    // 6. 写入 AITaskLog（无论成功失败）
    // 7. 返回结果
  }
}
```

### 5.2 material_diagnosis_agent

| 项目 | 内容 |
|------|------|
| **输入 JSON Schema** | `{ projectId: string, material: { content: string } }` |
| **输出 JSON Schema** | `Diagnosis`（见类型定义）|
| **prompt 变量** | `{{material_content}}` |
| **失败条件** | `content.length < 10` / AI 超时 / JSON 解析失败 / comedicPotential = 0（无法提取笑点）|
| **重试策略** | JSON 解析失败最多重试 2 次，每次用不同的 fallback prompt |
| **JSON 解析失败 fallback** | 返回简化诊断：`{ summary: "无法完整分析", comedicPotential: 0 }` + 前端显示友好错误 |
| **保存到 WorkflowCard** | 否，保存到 `Project.diagnosis` |
| **写入 AITaskLog** | 是（agentType='material_diagnosis', stepType='diagnosis'）|

**Prompt 模板（简化示意）：**
```
你是一位脱口秀教练。请分析用户提供的素材，提取其中的喜剧元素。

素材内容：
{{material_content}}

请以 JSON 格式输出分析结果，必须包含以下字段：
- summary: 一句话总结这个素材的核心是什么
- conflict: { label, description, why_this_works } — 核心冲突是什么，为什么好笑
- emotion: { primary, secondary[] } — 主要情绪和次级情绪
- comedicPotential: 1-5 的数字，表示喜剧潜力
- estimatedLength: 预估演讲时长

要求：
1. 输出必须是合法的 JSON，不能有额外文字
2. comedicPotential 如果低于 1（即无法提取笑点），设为 0
3. why_this_works 要用用户的语言解释，不要用专业术语
```

### 5.3 premise_generator_agent

| 项目 | 内容 |
|------|------|
| **输入 JSON Schema** | `{ projectId: string, diagnosis: Diagnosis }` |
| **输出 JSON Schema** | `{ premises: Premise[] }`（3 个 Premise，每个含 title/description/why_it_works/coach_tip/next_question/tags）|
| **prompt 变量** | `{{diagnosis_summary}}`, `{{conflict_label}}`, `{{emotion_primary}}` |
| **失败条件** | AI 超时 / JSON 解析失败 / 返回不足 3 个 premise |
| **重试策略** | 解析失败最多重试 2 次 |
| **JSON 解析失败 fallback** | 返回 3 个默认 premise（泛化内容），前端显示「本次生成不完整」提示 |
| **保存到 WorkflowCard** | 是（stepType='premise', 批量创建 3 条）|
| **写入 AITaskLog** | 是（agentType='premise_generator', stepType='premise'）|

### 5.4 angle_generator_agent

| 项目 | 内容 |
|------|------|
| **输入 JSON Schema** | `{ projectId: string, diagnosis: Diagnosis, selectedPremise: WorkflowCard }` |
| **输出 JSON Schema** | `{ angles: Angle[] }`（3 个 Angle，每个含 title/description/why_it_works/coach_tip/next_question/tags/potential_label）|
| **prompt 变量** | `{{diagnosis_summary}}`, `{{premise_title}}`, `{{premise_description}}`, `{{conflict_label}}` |
| **失败条件** | 同 premise_generator |
| **重试策略** | 同 premise_generator |
| **JSON 解析失败 fallback** | 同 premise_generator |
| **保存到 WorkflowCard** | 是（stepType='angle', 批量创建 3 条）|
| **写入 AITaskLog** | 是（agentType='angle_generator', stepType='angle'）|

### 5.5 punchline_generator_agent

| 项目 | 内容 |
|------|------|
| **输入 JSON Schema** | `{ projectId: string, diagnosis: Diagnosis, selectedPremise: WorkflowCard, selectedAngle: WorkflowCard }` |
| **输出 JSON Schema** | `{ punchlines: Punchline[] }`（6 个 Punchline，每个含 content/why_this_works/coach_tip/next_question/type_tag/placement）|
| **prompt 变量** | `{{diagnosis_summary}}`, `{{premise_title}}`, `{{angle_title}}`, `{{material_content}}`, `{{target_duration}}` |
| **失败条件** | 同 premise_generator |
| **重试策略** | 同 premise_generator |
| **JSON 解析失败 fallback** | 返回 6 个默认 punchline（泛化内容）|
| **保存到 WorkflowCard** | 是（stepType='punchline', 批量创建 6 条）|
| **写入 AITaskLog** | 是（agentType='punchline_generator', stepType='punchline'）|

### 5.6 script_composer_agent

| 项目 | 内容 |
|------|------|
| **输入 JSON Schema** | `{ projectId: string, material: Material, diagnosis: Diagnosis, selectedPremise: WorkflowCard, selectedAngle: WorkflowCard, selectedPunchlines: WorkflowCard[], targetDuration: TargetDuration }` |
| **输出 JSON Schema** | `{ script: string, wordCount: number, coachReview: CoachReview }` |
| **prompt 变量** | `{{material_content}}`, `{{diagnosis_summary}}`, `{{premise_title}}`, `{{angle_title}}`, `{{punchlines_content}}`, `{{target_duration}}` |
| **失败条件** | AI 超时（> 60s）/ JSON 解析失败 / script 字数为 0 |
| **重试策略** | 解析失败最多重试 3 次（草稿生成较关键）|
| **JSON 解析失败 fallback** | 仅保留 script 字段，coachReview 返回空结构 |
| **保存到 WorkflowCard** | 否，保存到 `Project.finalScript` + `Project.wordCountFinal` + `Project.durationFinal` |
| **写入 AITaskLog** | 是（agentType='script_composer', stepType='draft'）|

### 5.7 recommend_agent（轻量推荐）

| 项目 | 内容 |
|------|------|
| **输入 JSON Schema** | `{ projectId: string, stepType: 'premise' | 'angle', diagnosis: Diagnosis, existingCards: WorkflowCard[], userFavorites?: WorkflowCard[] }` |
| **输出 JSON Schema** | `{ recommendedCardId: string, reason: string }` |
| **prompt 变量** | `{{diagnosis_summary}}`, `{{emotion_primary}}`, `{{conflict_label}}`, `{{cards_json}}`, `{{favorites_json}}` |
| **失败条件** | AI 超时 / 无可用卡片 |
| **重试策略** | 不重试（轻量操作，快速返回）|
| **JSON 解析失败 fallback** | 返回第一个卡片（default 兜底）|
| **保存到 WorkflowCard** | 否 |
| **写入 AITaskLog** | 是（agentType='recommend'）|

---

## 6. 前端状态管理设计

### 6.1 Store 架构总览

```
┌──────────────────────────────────────────────────────────┐
│                      Zustand Stores                       │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │  projectStore   │  │   cardStore     │                │
│  │                 │  │                 │                │
│  │ - currentProject│  │ - cards[]       │                │
│  │ - currentStep   │  │ - selectedIds   │                │
│  │ - draftMaterial │  │ - favoriteIds   │                │
│  │                 │  │ - editingCardId │                │
│  │ + createProject │  │ + selectCard    │                │
│  │ + updateProject │  │ + favoriteCard │                │
│  │ + setStep       │  │ + editCard     │                │
│  │ + restoreFromLS │  │ + reorderPunch │                │
│  └────────┬────────┘  └────────┬────────┘                │
│           │                      │                         │
│           │  共享 currentProject  │                         │
│           ▼                      ▼                         │
│  ┌─────────────────────────────────────────────┐          │
│  │              Zustand Middlewares             │          │
│  │                                               │          │
│  │  persist 中间件 ───→ localStorage            │          │
│  │  devtools 中间件 ───→ Redux DevTools        │          │
│  │                                               │          │
│  └─────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│                    React Components                        │
│                                                          │
│  组件通过 selector 只订阅需要的 state 片段：              │
│                                                          │
│  const step = useProjectStore(s => s.currentStep)       │
│  const cards = useCardStore(s => s.cards.filter(         │
│    c => c.stepType === 'premise'                        │
│  ))                                                      │
│  const isLoading = useUIStore(s => s.loading)           │
└──────────────────────────────────────────────────────────┘
```

### 6.2 projectStore

```typescript
// store/projectStore.ts

interface ProjectState {
  // 当前项目
  currentProject: Project | null

  // 当前步骤
  currentStep: WorkflowStep

  // 草稿素材（未提交前保存在这里）
  draftMaterial: { content: string } | null

  // 诊断结果（AI 生成后写入）
  diagnosis: Diagnosis | null

  // 已选前提/角度（卡片 ID）
  selectedPremiseId: string | null
  selectedAngleId: string | null
  selectedPunchlineIds: string[]

  // 最终稿
  finalScript: string | null

  // 动作
  setProject: (project: Project) => void
  setStep: (step: WorkflowStep) => void
  setDraftMaterial: (material: { content: string }) => void
  setDiagnosis: (diagnosis: Diagnosis) => void
  selectPremise: (id: string) => void
  selectAngle: (id: string) => void
  selectPunchline: (id: string, order: number) => void
  deselectPunchline: (id: string) => void
  reorderPunchline: (fromIndex: number, toIndex: number) => void
  setFinalScript: (script: string) => void
  clearProject: () => void

  // 从 localStorage 恢复
  restore: () => void
}

// persist 配置：只持久化 draftMaterial / selectedPremiseId / selectedAngleId / selectedPunchlineIds
// currentProject 每次从 API 获取，不持久化（或仅缓存 projectId）
```

**persist key：`standup-project-v1`**

**持久化字段：**
```typescript
{
  draftMaterial: { content: string },
  selectedPremiseId: string | null,
  selectedAngleId: string | null,
  selectedPunchlineIds: string[],
  currentStep: WorkflowStep
}
```

**不持久化（每次从 API 恢复）：**
- currentProject（可能已过期）
- diagnosis
- finalScript
- cards（从 API 重新拉取）

### 6.3 cardStore

```typescript
// store/cardStore.ts

interface CardState {
  // 所有卡片（按 stepType 分组）
  cards: WorkflowCard[]

  // 筛选
  premiseCards: WorkflowCard[]   // stepType === 'premise'
  angleCards: WorkflowCard[]    // stepType === 'angle'
  punchlineCards: WorkflowCard[] // stepType === 'punchline'

  // 已选 ID
  selectedPremiseId: string | null
  selectedAngleId: string | null
  selectedPunchlineIds: string[]

  // 收藏 ID
  favoriteIds: string[]

  // 编辑中卡片
  editingCardId: string | null
  editingContent: string

  // 推荐卡片（帮我推荐）
  recommendedCardId: string | null
  recommendReason: string | null

  // 动作
  setCards: (cards: WorkflowCard[]) => void
  selectCard: (id: string, stepType: StepType, order?: number) => void
  deselectCard: (id: string) => void
  favoriteCard: (id: string) => void
  unfavoriteCard: (id: string) => void
  startEditing: (id: string, content: string) => void
  updateEditingContent: (content: string) => void
  saveEditing: (id: string) => void
  cancelEditing: () => void
  setRecommendResult: (cardId: string, reason: string) => void
  clearRecommendResult: () => void
  clearCards: (stepType?: StepType) => void
}
```

### 6.4 uiStore

```typescript
// store/uiStore.ts

type UIStatus = 'idle' | 'loading' | 'failed' | 'saved' | 'saving'

interface UIState {
  // 全局状态
  globalStatus: UIStatus

  // 各步骤状态
  materialStatus: UIStatus  // 素材输入
  diagnosisStatus: UIStatus // AI 诊断
  premiseStatus: UIStatus  // 前提生成
  angleStatus: UIStatus    // 角度生成
  punchlineStatus: UIStatus // 包袱生成
  draftStatus: UIStatus    // 草稿生成

  // 错误信息
  error: {
    code: string
    message: string
    retryable: boolean
  } | null

  // 重试计数
  retryCount: number

  // 自动保存
  autoSaving: boolean
  lastSavedAt: string | null

  // 教练提示面板
  coachTipVisible: boolean
  coachTipCardId: string | null  // 展开教练提示的卡片 ID

  // 帮我推荐弹窗
  recommendModalVisible: boolean

  // 取消确认弹窗
  cancelConfirmVisible: boolean

  // 动作
  setStatus: (step: WorkflowStep, status: UIStatus) => void
  setError: (error: UIState['error']) => void
  incrementRetry: () => void
  resetRetry: () => void
  setAutoSaving: (saving: boolean) => void
  setLastSavedAt: (time: string) => void
  toggleCoachTip: (cardId: string) => void
  showRecommendModal: () => void
  hideRecommendModal: () => void
  showCancelConfirm: () => void
  hideCancelConfirm: () => void
}
```

### 6.5 页面刷新恢复流程

```
页面加载（app/router 或 useEffect）
    │
    ▼
检查 Zustand persist localStorage
    │
    ├──→ 有数据：restore() → 填充到 store
    │
    │    ├─ 有 projectId → 调用 GET /api/projects/[id]
    │    │                 ├─ 成功 → 合并到 currentProject
    │    │                 │       调用 GET /api/projects/[id]/cards
    │    │                 │       填充到 cardStore
    │    │                 │       恢复步骤到上次停留的页面
    │    │                 │
    │    │                 └─ 失败（404）→ 清空 localStorage
    │    │                                    跳转到 /create/material
    │    │                                    （用户需要重新开始）
    │    │
    │    └─ 无 projectId（仅 draftMaterial）
    │              → 恢复 draftMaterial 到输入框
    │              恢复 currentStep 到 material
    │              跳转到 /create/material
    │
    └──→ 无数据：跳转到首页 /
```

### 6.6 状态管理规则

| 状态来源 | 保存位置 | 时机 | 前端 UI 响应 |
|----------|----------|------|-------------|
| 用户输入素材 | `projectStore.draftMaterial` | 防抖 3 秒后 | Toast「已保存 ✓」|
| 用户选择前提 | `cardStore + projectStore` | 立即 | 无感知（毫秒级）|
| 用户选择角度 | `cardStore + projectStore` | 立即 | 无感知 |
| 用户选择包袱 | `cardStore + projectStore` | 立即 | 草稿预览区实时更新 |
| 用户编辑卡片 | `cardStore` + API | 防抖 2 秒 | Toast「已保存 ✓」|
| 用户编辑草稿 | `projectStore.finalScript` + API | 防抖 2 秒 | Toast「已保存 ✓」|
| AI 诊断成功 | `projectStore.diagnosis` + API | AI 回调后 | 跳转诊断结果页 |
| AI 生成成功 | `cardStore.cards` + API | AI 回调后 | 显示卡片列表 |

---

## 7. 自动保存技术方案

### 7.1 技术方案总览

```
┌────────────────────────────────────────────────────────────┐
│                      自动保存架构                          │
│                                                            │
│  ┌────────────┐    防抖     ┌─────────────┐                 │
│  │ 用户输入    │ ────────→ │ localStorage │                 │
│  │            │            │  (立即保存)  │                 │
│  └────────────┘            └──────┬──────┘                 │
│                                    │                        │
│                                    ▼                        │
│                          ┌─────────────────┐                 │
│                          │  debounce 3s 后  │                 │
│                          │   调用 API       │                 │
│                          └────────┬────────┘                 │
│                                   │                          │
│                    ┌─────────────┴─────────────┐            │
│                    ▼                           ▼            │
│             ┌──────────┐                ┌──────────┐         │
│             │  成功    │                │  失败    │         │
│             │          │                │          │         │
│             │ Toast ✓  │                │ Toast ✗  │         │
│             │ 重置计时 │                │ 重试按钮 │         │
│             └──────────┘                └──────────┘         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 7.2 素材输入自动保存

```typescript
// hooks/useAutoSave.ts

export function useAutoSave(projectId: string | null, material: string) {
  const { setAutoSaving, setLastSavedAt } = useUIStore()
  const { setDraftMaterial } = useProjectStore()
  const { setProject } = useProjectStore.getState() // 避免重复订阅

  const saveToLocal = useCallback(
    debounce(async (content: string) => {
      // 1. 立即写入 localStorage（Zustand persist）
      setDraftMaterial({ content })
      
      // 2. 调用 API 保存到数据库
      if (projectId) {
        setAutoSaving(true)
        try {
          await fetch('/api/autosave', {
            method: 'POST',
            body: JSON.stringify({ projectId, material: { content } })
          })
          setLastSavedAt(new Date().toISOString())
        } catch (err) {
          // 不阻塞用户继续输入
          console.error('Autosave failed:', err)
        } finally {
          setAutoSaving(false)
        }
      }
    }, 3000),
    [projectId]
  )

  // 每次 material 变化时触发（debounce 后执行）
  useEffect(() => {
    if (material.length > 0) {
      saveToLocal(material)
    }
  }, [material])
}
```

**debounce 实现（防止抖动）：**
```typescript
// lib/debounce.ts

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
```

### 7.3 选择卡片立即保存

```typescript
// 卡片点击时调用
async function handleSelectCard(card: WorkflowCard) {
  // 1. 更新前端 UI（乐观更新）
  cardStore.getState().selectCard(card.id, card.stepType)

  // 2. 立即调用 API（无 debounce）
  try {
    await fetch(`/api/cards/${card.id}/select`, {
      method: 'PATCH',
      body: JSON.stringify({ selected: true, stepType: card.stepType, order: card.order })
    })
  } catch (err) {
    // 失败：回滚 UI + Toast
    cardStore.getState().deselectCard(card.id)
    toast.error('保存失败，选择可能丢失')
  }
}
```

**乐观更新策略：** 先更新 UI，再调用 API。API 失败时回滚 UI 并提示用户。

### 7.4 编辑卡片保存

```typescript
// 编辑卡片时调用
async function handleEditCard(cardId: string, content: string) {
  // 1. 更新前端状态
  cardStore.getState().updateEditingContent(content)

  // 2. debounce 2 秒后调用 API
  debouncedSaveEdit(cardId, content)
}

const debouncedSaveEdit = debounce(async (cardId: string, content: string) => {
  try {
    await fetch(`/api/cards/${cardId}/edit`, {
      method: 'PATCH',
      body: JSON.stringify({ content })
    })
    toast.success('已保存 ✓')
  } catch (err) {
    toast.error('保存失败', { action: { label: '重试', onClick: () => handleEditCard(cardId, content) } })
  }
}, 2000)
```

### 7.5 草稿编辑保存

```typescript
// 同编辑卡片，debounce 2 秒
// 草稿编辑保存在 projectStore.finalScript
// API 调用 PATCH /api/projects/[id]，body: { finalScript }
```

### 7.6 保存失败重试策略

| 保存类型 | 失败处理 | 重试策略 |
|----------|----------|----------|
| 素材自动保存 | Toast「保存失败，[重试]」| 用户点击重试 或 下次输入触发 |
| 选择卡片 | 回滚 UI + Toast | 自动不重试（用户重新点击即可）|
| 编辑卡片 | Toast「保存失败，[重试]」| 用户点击重试 |
| 草稿编辑 | Toast「保存失败，[重试]」| 用户点击重试 |

### 7.7 本地缓存与服务端同步

```
初次访问（无 projectId）
    │
    ▼
创建项目 → projectId 生成
    │
    ▼
localStorage（draftMaterial）←── 实时同步 ──→ API（Project.material）
    │
    │  防抖 3s
    ▼
API 更新成功 → 同步时间戳 lastSavedAt
    │
    │  网络断开
    ▼
API 更新失败 → 保留 localStorage
    │
    ▼
网络恢复 → 无需手动同步
    │
    │  理由：下次自动保存时会覆盖 API 的旧值
    │  （前端 localStorage 是最新值）
```

**冲突解决策略（MVP 简化）：** 前端 localStorage 始终覆盖服务端（最后一次保存时间戳为准）。MVP 用户量少，冲突概率极低。

### 7.8 页面刷新恢复

```typescript
// hooks/useLocalRestore.ts

export function useLocalRestore() {
  const { restore, draftMaterial, currentStep, currentProject } = useProjectStore()
  const router = useRouter()

  useEffect(() => {
    // 1. 从 localStorage 恢复
    restore()

    // 2. 如果有 projectId，验证项目是否仍存在
    if (currentProject?.id) {
      fetch(`/api/projects/${currentProject.id}`)
        .then(res => {
          if (!res.ok) throw new Error('not found')
          return res.json()
        })
        .then(data => {
          // 合并最新项目数据
          useProjectStore.getState().setProject(data.project)
          useCardStore.getState().setCards(data.cards)
        })
        .catch(() => {
          // 项目不存在，清空并跳转
          useProjectStore.getState().clearProject()
          router.push('/create/material')
        })
    }
  }, [])
}
```

---

## 8. 路由与流程保护

### 8.1 路由守卫总览

| 用户尝试访问 | 条件 | 处理方式 |
|-------------|------|----------|
| `/create/diagnosis` | 无 draftMaterial 或 projectId | 重定向 `/create/material` |
| `/create/premise` | 无 diagnosis | 重定向 `/create/diagnosis` |
| `/create/angle` | 无 premiseId | 重定向 `/create/premise`（显示提示"请先选择前提"）|
| `/create/punchline` | 无 angleId | 重定向 `/create/angle`（显示提示"请先选择角度"）|
| `/create/draft` | selectedPunchlineIds 为空 | 重定向 `/create/punchline`（显示提示"请先选择包袱"）|
| `/projects/[id]` | 项目不存在 | 重定向 `/projects` |
| `/settings` | — | 允许 |

### 8.2 Next.js 中间件实现

```typescript
// middleware.ts

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 仅拦截 /create/* 路径
  if (!pathname.startsWith('/create/')) return NextResponse.next()

  // 从 cookie 或 header 传递的 auth 状态（未来扩展）
  // 目前 MVP 无登录，暂不验证

  return NextResponse.next()
}

export const config = {
  matcher: ['/create/:path*']
}
```

### 8.3 页面级守卫（Server Components）

```typescript
// app/create/angle/page.tsx

export default async function AnglePage({
  params,
  searchParams
}: {
  params: { id: string }
  searchParams: { projectId?: string }
}) {
  // 1. 获取 projectId
  const projectId = searchParams.projectId

  // 2. 获取项目数据
  if (!projectId) {
    redirect('/create/premise?error=missing_project')
  }

  const project = await getProject(projectId)

  // 3. 检查前提是否已选
  if (!project.premiseId) {
    redirect('/create/premise?error=missing_premise')
  }

  // 4. 获取已生成的角度卡片
  const angleCards = await getCards(projectId, 'angle')

  // 5. 如果没有角度卡片，调用 AI 生成（自动生成，无需用户触发）
  if (angleCards.length === 0) {
    // 这里有两种策略：
    // A. 自动生成（用户体验更流畅）
    // B. 跳转回前提页提示重新生成
    // MVP 采用策略 A
    await generateAngles(project)
    redirect(`/create/angle?projectId=${projectId}`)
  }

  return <AnglePageClient project={project} cards={angleCards} />
}
```

### 8.4 重新选择后的下游清空逻辑

```
用户切换前提
    │
    ▼
清空 angleId
    │
    ├─ 同时清空 punchlineIds
    │
    ├─ 同时清空 finalScript
    │
    ▼
重置到 angle 选择步骤
    │
    ▼
重新调用 angle_generator_agent
    │
    ▼
删除旧的 premise 卡片（软删除或物理删除）
删除旧的 angle 卡片
删除旧的 punchline 卡片
```

| 操作 | 清空 premiseId | 清空 angleId | 清空 punchlineIds | 清空 finalScript |
|------|---------------|-------------|------------------|-----------------|
| 重新选择前提 | ✓（重置）| ✓ | ✓ | ✓ |
| 重新选择角度 | — | ✓（重置）| ✓ | ✓ |
| 重新选择包袱 | — | — | ✓（重置）| ✓ |
| 编辑草稿 | — | — | — | ✓（仅更新）|

### 8.5 生成中用户返回处理

**产品决策：** loading 时不禁止返回，但显示确认弹窗。

```typescript
// components/ConfirmDialog.tsx

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

// 使用场景：AI 生成中用户点击返回
// <ConfirmDialog
//   open={cancelConfirmVisible}
//   title="确认取消？"
//   message="当前生成会中断，是否确认返回？"
//   confirmText="确认返回"
//   cancelText="继续生成"
//   onConfirm={() => {
//     // 取消 AI 请求（AbortController）
//     // 返回上一页
//     router.back()
//   }}
// />
```

**AbortController 实现：**
```typescript
// hooks/useAICall.ts

const abortControllerRef = useRef<AbortController | null>(null)

async function callAI(endpoint: string, body: object) {
  abortControllerRef.current = new AbortController()
  
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      signal: abortControllerRef.current.signal
    })
    // ...
  } catch (err) {
    if (err.name === 'AbortError') {
      // 用户取消，不显示错误
      return
    }
    // 其他错误处理
  }
}

function cancel() {
  abortControllerRef.current?.abort()
}
```

---

## 9. 错误处理规范

### 9.1 错误处理总表

| 错误场景 | 前端提示 | 后端错误码 | HTTP 状态 | 可重试 | 保留用户输入 |
|---------|---------|-----------|----------|--------|------------|
| **AI 超时** | 「网络有点慢，请重试」| `AI_TIMEOUT` | 408 | ✅（最多 3 次）| ✅ |
| **JSON 解析失败** | 「生成内容格式异常，请重试」| `JSON_PARSE_ERROR` | 422 | ✅（最多 2 次）| ✅ |
| **网络失败** | 「网络连接失败，请检查网络」| `NETWORK_ERROR` | — | ✅ | ✅ |
| **自动保存失败** | Toast「保存失败，[重试]」| `SAVE_FAILED` | — | ✅（用户触发）| ✅ |
| **数据不存在** | Toast + 跳转列表页 | `NOT_FOUND` | 404 | ❌ | — |
| **素材太短（< 10字）**| 「素材太短，无法分析，请补充一些内容」| `MATERIAL_TOO_SHORT` | 400 | ❌ | ✅ |
| **素材偏短（< 30字）**| 「💡 素材越具体，结果越好」（警告，非阻止）| — | — | — | ✅ |
| **未选择卡片** | 「请先选择一个方向」/「请至少选择一个包袱」| — | — | ❌ | ✅ |
| **模型返回空内容** | 「生成内容为空，请重试」| `EMPTY_RESPONSE` | 422 | ✅ | ✅ |
| **项目不存在** | Toast「项目不存在」+ 跳转 | `PROJECT_NOT_FOUND` | 404 | ❌ | ❌ |
| **卡片不存在** | Toast「该卡片已失效」+ 刷新列表 | `CARD_NOT_FOUND` | 404 | ❌ | ✅ |

### 9.2 AI 超时处理

```typescript
// agents/base.ts

async function callWithTimeout(
  fn: () => Promise<string>,
  timeoutMs: number = 30000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('AI_TIMEOUT'))
    }, timeoutMs)

    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer))
  })
}

// 使用
async function run() {
  try {
    const raw = await callWithTimeout(() => openai.chat.completions.create({...}), 30000)
  } catch (err) {
    if (err.message === 'AI_TIMEOUT') {
      // 写入 AITaskLog，status='timeout'
      // 返回前端友好的错误
      throw new APIError('AI_TIMEOUT', 'AI 处理超时，请重试', 408, true)
    }
  }
}
```

**超时阈值设定：**
| Agent | 超时阈值 |
|-------|---------|
| material_diagnosis | 30s |
| premise_generator | 30s |
| angle_generator | 30s |
| punchline_generator | 30s |
| script_composer | 60s |
| recommend | 15s |

### 9.3 JSON 解析失败处理

```typescript
// lib/json-parser.ts

interface ParseResult<T> {
  success: boolean
  data?: T
  error?: string
}

export function parseAIJSON<T>(raw: string, schema: ZodSchema<T>): ParseResult<T> {
  try {
    const jsonStr = extractJSON(raw) // 提取 ```json ... ``` 包裹的内容
    const parsed = JSON.parse(jsonStr)
    
    // Zod 校验
    const result = schema.safeParse(parsed)
    if (!result.success) {
      return { success: false, error: `Schema validation failed: ${result.error.message}` }
    }
    
    return { success: true, data: result.data }
  } catch (err) {
    return { success: false, error: `JSON parse error: ${err.message}` }
  }
}

// 提取 JSON（处理 markdown 代码块）
function extractJSON(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) return match[1].trim()
  
  // 如果没有代码块，尝试直接解析
  const trimmed = raw.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return trimmed
  }
  
  throw new Error('No valid JSON found in response')
}
```

### 9.4 自动保存失败处理

```typescript
// 保存失败的 UI 反馈
async function saveWithRetry(
  fn: () => Promise<void>,
  maxRetries: number = 3
) {
  let lastError: Error | null = null
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fn()
      return // 成功
    } catch (err) {
      lastError = err
      // 指数退避：1s → 2s → 4s
      await sleep(Math.pow(2, i) * 1000)
    }
  }
  
  // 全部失败
  toast.error('保存失败', {
    description: '请检查网络后重试',
    action: {
      label: '重试',
      onClick: () => saveWithRetry(fn, 1) // 再试一次
    },
    duration: Infinity // 不自动消失
  })
}
```

### 9.5 未选择卡片的处理

```typescript
// components/ Footer.tsx（底部主 CTA）

function Footer({ stepType, onPrimaryClick, disabled }: FooterProps) {
  const selectedCount = useCardStore(s => 
    stepType === 'punchline' 
      ? s.selectedPunchlineIds.length 
      : 1
  )
  
  const canProceed = 
    (stepType === 'punchline' && selectedCount > 0) ||
    (stepType !== 'punchline' && selectedCount > 0) ||
    stepType === 'material' // 素材页不需要选择，直接输入即可

  return (
    <PrimaryButton
      onClick={onPrimaryClick}
      disabled={!canProceed}
    >
      {!canProceed ? (
        stepType === 'punchline' 
          ? '请至少选择一个包袱' 
          : '请先选择一个方向'
      ) : '下一步 →'}
    </PrimaryButton>
  )
}
```

---

## 10. 静态 Demo 开发计划

### 10.1 开发目标

- **不接真实 AI**：所有 AI 调用使用 mock 数据
- **不接真实数据库**：使用 Zustand + localStorage 模拟数据持久化
- **保留接口抽象**：API 调用用 mock service 封装，后续可无缝替换为真实 API
- **移动端优先**：375px 布局优先，桌面端保持一致
- **覆盖 MVP 完整流程**：10 个页面的交互逻辑

### 10.2 技术准备

| 准备项 | 内容 | 优先级 |
|--------|------|--------|
| 项目脚手架 | Next.js + TypeScript + Tailwind 初始化 | P0 |
| Zustand 配置 | 3 个 store + persist 中间件 | P0 |
| API Mock Service | 封装 fetch，模拟所有 API 响应 | P0 |
| Prisma Mock | 模拟 Prisma Client，返回假数据 | P1（可跳过，直接 mock API）|
| Mock 数据 | 为每个 Agent 准备典型/边界 mock 数据 | P0 |

### 10.3 Mock 数据设计

#### Mock 诊断数据

```typescript
// mock/data/diagnosis.ts

export const mockDiagnosis: Diagnosis = {
  summary: "这个素材讲的是你的相亲对象迟到+多占便宜，展现了一种「以自我为中心」的人际模式",
  conflict: {
    label: "自我中心 vs 被动吃亏",
    description: "对方的算计和你的被动接受形成对比",
    why_this_works: "强弱对比明显，观众会有代入感"
  },
  emotion: {
    primary: "委屈",
    secondary: ["愤怒", "自嘲", "无奈"]
  },
  comedicPotential: 4,
  estimatedLength: "约 1 分钟"
}
```

#### Mock 卡片数据

```typescript
// mock/data/cards.ts

export const mockPremises: WorkflowCard[] = [
  {
    id: 'premise-1',
    projectId: 'proj-1',
    stepType: 'premise',
    title: '量化委屈',
    content: '把迟到的时间和金钱损失算清楚，用数字讲一个理性的笑话',
    metadata: {
      why_it_works: '让委屈变成可验证的荒谬',
      coach_tip: '用数字对比制造荒谬感，比如迟到30分钟=损失2杯咖啡',
      next_question: '你能接受的最荒诞的数字对比是什么？',
      tags: ['人际关系', '量化'],
    },
    selected: false,
    favorite: false,
    editable: false,
    order: 0,
    createdBy: 'ai',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ... 3 张
]

export const mockAngles: WorkflowCard[] = [
  {
    id: 'angle-1',
    projectId: 'proj-1',
    stepType: 'angle',
    title: '从"他也有道理"角度切入',
    content: '原本你觉得是他不对，但你后来发现他有自己的逻辑',
    metadata: {
      why_it_works: '态度反转让观众有「哦原来是这样」的感觉',
      coach_tip: '反转的力度取决于你后来发现的「他的逻辑」有多荒诞',
      next_question: '他为什么会迟到？是真忙还是故意？',
      tags: ['人际关系', '态度反转'],
      potential_label: 'high',
    },
    selected: false,
    favorite: false,
    editable: false,
    order: 0,
    createdBy: 'ai',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ... 3 张
]

export const mockPunchlines: WorkflowCard[] = [
  {
    id: 'punchline-1',
    projectId: 'proj-1',
    stepType: 'punchline',
    title: null,
    content: '她迟到了半小时，进门第一句话是「菜单呢？」',
    metadata: {
      type_tag: '铺垫',
      placement: '前面',
      why_this_works: '具体的行为描述，让观众立刻有画面感',
      coach_tip: '这个铺垫很口语化，和真实生活中一样',
      next_question: '当时你心里是什么感受？',
    },
    selected: false,
    favorite: false,
    editable: false,
    order: 0,
    createdBy: 'ai',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ... 6 张
]
```

#### Mock 草稿数据

```typescript
// mock/data/draft.ts

export const mockDraft: Project = {
  id: 'proj-1',
  title: '相亲对象点两份套餐',
  status: 'in_progress',
  material: { content: '上周相亲...' },
  diagnosis: mockDiagnosis,
  premiseId: 'premise-1',
  angleId: 'angle-1',
  selectedPunchlineIds: ['punchline-1', 'punchline-2'],
  finalScript: `我上周相亲，遇到了一个有商业头脑的人。

她迟到了半小时，进门第一句话是「菜单呢？」

我当时就想，这是什么开场白？我们的相亲是要谈生意吗？

然后她点了两份套餐。

...`,
  wordCountFinal: 738,
  durationFinal: 60,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}
```

#### Mock 异常数据

| 场景 | mock 数据 |
|------|----------|
| JSON 解析失败 | 返回非 JSON 字符串：`"好的，我来分析..."` |
| AI 超时 | Promise 延迟 35s 后 reject |
| 空内容 | 返回 `{ script: "" }` |
| 素材太短 | `content: "相亲"`（仅 2 字）|

### 10.4 Mock API Service

```typescript
// lib/mockApi.ts

// 模拟延迟（ms）
const DELAY = {
  FAST: 500,
  NORMAL: 1500,
  SLOW: 3000,
  TIMEOUT: 35000,
}

// 随机失败率（MVP 测试用）
const FAIL_RATE = 0.1 // 10%

export const mockApi = {
  // 素材诊断
  async diagnose(body: DiagnoseMaterialRequest): Promise<AICallResponse> {
    await sleep(DELAY.SLOW)
    if (Math.random() < FAIL_RATE) {
      return { success: false, error: { code: 'AI_TIMEOUT', message: '网络超时', retryable: true }}
    }
    return { success: true, data: { diagnosis: mockDiagnosis }}
  },

  // 生成前提
  async generatePremise(body: GeneratePremiseRequest): Promise<AICallResponse> {
    await sleep(DELAY.SLOW)
    return { success: true, data: { cards: mockPremises }}
  },

  // ... 其他方法类似
}
```

### 10.5 任务拆分

#### P0 任务（必须完成，MVP 核心）

| # | 任务 | 子任务 | 预计工时 |
|---|------|--------|---------|
| **P0-1** | **项目脚手架搭建** | Next.js + TS + Tailwind 初始化 | 1h |
|  |  | Zustand store 初始化（3 个 store + persist）| 2h |
|  |  | Tailwind 配置（移动端优先、主题变量）| 1h |
|  |  | 全局布局组件（AppShell / Header / Footer）| 2h |
| **P0-2** | **基础 UI 组件库** | Button / Card / Badge / Skeleton / Spinner / Toast / Modal | 4h |
|  |  | ProgressBar（进度条）| 1h |
|  |  | Textarea（大文本输入框）| 1h |
|  |  | ConfirmDialog（取消确认弹窗）| 1h |
| **P0-3** | **Mock API Service** | mock 数据文件（诊断/卡片/草稿/异常）| 2h |
|  |  | mockApi 封装（所有接口）| 3h |
|  |  | API 切换层（easy mock → real API）| 1h |
| **P0-4** | **首页 / 工作台** | 页面布局 | 1h |
|  |  | 「开始创作」跳转逻辑 | 0.5h |
|  |  | 「我的段子」跳转逻辑 | 0.5h |
| **P0-5** | **素材输入页** | 页面布局 + 进度条 | 1h |
|  |  | 文本输入框 + 字数统计 | 1h |
|  |  | 自动保存（debounce 3s）| 2h |
|  |  | 素材不足状态（< 30 字警告，非阻止）| 1h |
|  |  | 跳转诊断结果页 | 1h |
| **P0-6** | **诊断结果页** | 页面布局 | 1h |
|  |  | 诊断摘要卡片 | 1h |
|  |  | 教练点评卡片 | 1h |
|  |  | 跳转前提选择页 | 0.5h |
| **P0-7** | **前提选择页** | 页面布局 | 1h |
|  |  | PremiseCard 组件（默认/选中/收藏/编辑/折叠/展开）| 3h |
|  |  | 单选逻辑 | 1h |
|  |  | 教练提示折叠/展开 | 1h |
|  |  | 跳转角度选择页 | 0.5h |
| **P0-8** | **角度选择页** | 页面布局 | 1h |
|  |  | AngleCard 组件（含潜力标签）| 2h |
|  |  | 单选逻辑 + 跳转包袱选择页 | 1h |
|  |  | 帮我推荐弹窗 | 3h |
| **P0-9** | **包袱选择页** | 页面布局 | 1h |
|  |  | PunchlineCard 组件（含类型标签 + 上移/下移按钮）| 3h |
|  |  | 多选逻辑 | 2h |
|  |  | 上移/下移按钮逻辑 | 2h |
|  |  | 草稿预览区（实时显示已选包袱顺序）| 2h |
|  |  | 跳转草稿生成页 | 1h |
| **P0-10** | **草稿生成页** | 页面布局 | 1h |
|  |  | 草稿展示卡片 | 1h |
|  |  | 教练点评卡片（coach_review）| 2h |
|  |  | 编辑模式（debounce 2s 保存）| 3h |
|  |  | 标记完成 + 跳转项目详情 | 1h |
|  |  | 「重新生成」按钮 | 1h |
| **P0-11** | **loading / failed 状态** | LoadingState 组件（分步骤进度条）| 2h |
|  |  | FailedState 组件（错误信息 + 重试按钮）| 2h |
|  |  | 各页面接入 loading/failed 状态 | 4h |
|  |  | 取消确认弹窗（生成中返回）| 2h |
| **P0-12** | **项目列表页** | 页面布局 | 1h |
|  |  | ProjectCard 组件 | 2h |
|  |  | 空列表状态 | 1h |
|  |  | 跳转项目详情 | 0.5h |
| **P0-13** | **项目详情页** | 页面布局 | 1h |
|  |  | ProjectTimeline 组件（创作过程时间轴）| 3h |
|  |  | 最终稿展示 | 1h |
|  |  | 操作按钮组（复制/重新开始/继续创作）| 2h |
| **P0-14** | **路由守卫** | 页面级守卫（检查前置条件）| 3h |
|  |  | 重新选择后的下游清空逻辑 | 3h |
|  |  | 页面刷新恢复（useLocalRestore hook）| 3h |
| **P0-15** | **自动保存** | useAutoSave hook（素材 debounce 3s）| 2h |
|  |  | Toast 提示（saving / saved / failed）| 2h |
|  |  | 编辑卡片保存（debounce 2s）| 2h |
| |  | 保存失败重试 | 1h |

**P0 总工时估算：约 65-75 小时**

#### P1 任务（重要，建议完成）

| # | 任务 | 子任务 | 预计工时 |
|---|------|--------|---------|
| **P1-1** | **收藏功能** | favorite 标记逻辑 | 2h |
|  |  | 收藏态 UI（卡片右上角 ♥）| 1h |
| **P1-2** | **卡片编辑功能** | 点击「编辑」→ 进入编辑模式 | 2h |
|  |  | 保存/取消逻辑 | 1h |
| **P1-3** | **CoachTipPanel 折叠** | 卡片内 coach_tip 默认折叠 | 2h |
|  |  | 点击「展开教练提示」展开 | 1h |
| **P1-4** | **重新生成** | 「再想想」按钮（重新生成单组卡片）| 3h |
|  |  | 重新生成后清空下游内容 | 2h |
| **P1-5** | **桌面端适配** | 桌面端布局（max-width 640px 居中）| 3h |
|  |  | 桌面端卡片展开态 | 2h |
| **P1-6** | **项目删除** | 删除按钮 + 确认弹窗 | 2h |
|  |  | 删除后跳转列表 | 0.5h |
| **P1-7** | **设置页** | 稿子长度设置 | 1h |
|  |  | AI 模型选择 | 1h |

**P1 总工时估算：约 25 小时**

#### P2 任务（锦上添花，MVP 后完成）

| # | 任务 | 预计工时 |
|---|------|---------|
| **P2-1** | 创作偏好持久化（UserSettings）| 3h |
| **P2-2** | 骨架屏加载态（替代 Spinner）| 3h |
| **P2-3** | 页面切换动画（Framer Motion）| 4h |
| **P2-4** | 触摸反馈（卡片点击涟漪效果）| 2h |
| **P2-5** | 分享功能（复制链接）| 2h |

### 10.6 开发优先级建议

```
第 1 周：完成 P0-1 → P0-8（脚手架 + 首页 + 素材 + 诊断 + 前提 + 角度）
第 2 周：完成 P0-9 → P0-15（包袱 + 草稿 + loading态 + 项目列表/详情 + 守卫/自动保存）
第 3 周：完成 P1 任务 + P0 扫尾 + E2E 测试
```

---

## 11. 测试计划

### 11.1 E2E 测试用例（Playwright）

#### 11.1.1 主流程 E2E

| 用例 ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|--------|
| E2E-01 | 完整创作流程 | 首页 → 输入素材（>30字）→ 诊断 → 选前提 → 选角度 → 选包袱（≥1）→ 生成草稿 → 标记完成 → 项目详情 | 全流程顺利，状态正确更新 | P0 |
| E2E-02 | 短素材创作 | 输入素材「相亲」（2字）→ 继续诊断 → 查看警告提示 → 查看诊断结果 | 显示「素材越具体，结果越好」警告，AI 仍能处理 | P1 |
| E2E-03 | 仅选一个包袱完成 | 选包袱时仅选 1 个 → 生成草稿 → 标记完成 | 草稿生成成功，流程正常 | P1 |
| E2E-04 | 中途取消并重新开始 | 输入素材 → 诊断 → 选择前提 → 点击「重新开始」| 项目清空，跳转素材输入页 | P2 |

#### 11.1.2 移动端布局

| 用例 ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|--------|
| E2E-10 | 375px 无横向滚动 | 在 375px viewport 下操作所有页面 | 无横向滚动条，内容不溢出 | P0 |
| E2E-11 | 768px 平板布局 | 在 768px viewport 下操作 | 内容居中，两侧留白 | P1 |
| E2E-12 | 1440px 桌面布局 | 在 1440px viewport 下操作 | 内容居中（max 640px），两侧留白 | P1 |

#### 11.1.3 卡片交互

| 用例 ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|--------|
| E2E-20 | 前提单选 | 点击前提卡片 A → 点击前提卡片 B | A 取消选中，B 选中（单选）| P0 |
| E2E-21 | 角度单选 | 同上 | 同上 | P0 |
| E2E-22 | 包袱多选 | 点击包袱 A → 点击包袱 B → 点击包袱 A | A 选中→取消→选中，B 选中 | P0 |
| E2E-23 | 包袱上移/下移 | 选中 3 个包袱 → 点击「上移」→ 查看顺序 | 顺序更新，草稿预览同步更新 | P0 |
| E2E-24 | 卡片展开教练提示 | 前提卡片默认折叠 → 点击「展开教练提示」| coach_tip / why_it_works / next_question 展开 | P0 |
| E2E-25 | 卡片收藏 | 点击卡片「收藏」| 卡片右上角显示 ♥ 标记 | P0 |
| E2E-26 | 卡片编辑 | 点击卡片「编辑」→ 修改内容 → 保存 | 内容更新，createdBy 变为 user | P1 |
| E2E-27 | 帮我推荐 | 在角度页停留 > 30s 未选择 → 点击「帮我推荐」| 显示推荐弹窗，包含推荐卡片和原因 | P1 |

#### 11.1.4 自动保存

| 用例 ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|--------|
| E2E-30 | 素材自动保存 | 输入素材 → 停止 3 秒 → 查看 Toast | 显示「已保存 ✓」Toast | P0 |
| E2E-31 | 素材未保存时刷新 | 输入素材（未触发保存）→ 刷新页面 | 内容从 localStorage 恢复 | P0 |
| E2E-32 | 保存失败重试 | 模拟网络失败 → 输入素材 → 查看 Toast | 显示「保存失败，[重试]」Toast | P1 |
| E2E-33 | 选择卡片立即保存 | 点击卡片选中 → 刷新 → 查看选中态 | 选中态保留 | P0 |

#### 11.1.5 返回上一步

| 用例 ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|--------|
| E2E-40 | 返回上一步内容保留 | 选前提 → 选角度 → 点击「←」→ 查看前提 | 前提保持选中态 | P0 |
| E2E-41 | 返回素材页 | 从诊断结果页返回 → 查看素材内容 | 素材内容保留 | P0 |
| E2E-42 | 返回到无选择态页面 | 选择角度后返回前提页 → 查看角度 | 角度保持选中态 | P0 |

#### 11.1.6 重新选择导致下游内容处理

| 用例 ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|--------|
| E2E-50 | 切换前提清空角度 | 选择前提 A → 选择角度 B → 重新选择前提 C | 角度清空，跳转到角度选择页 | P0 |
| E2E-51 | 切换角度清空包袱 | 选择角度 A → 选择包袱 B/C → 重新选择角度 C | 包袱清空，跳转到包袱选择页 | P0 |
| E2E-52 | 重新选择包袱清空草稿 | 选择包袱 → 生成草稿 → 重新选择包袱 | 草稿清空 | P0 |
| E2E-53 | 「再想想」清空卡片 | 前提页面点击「再想想」| 前提卡片刷新（重新生成）| P1 |

#### 11.1.7 loading / failed / retry

| 用例 ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|--------|
| E2E-60 | AI 诊断 loading | 输入素材 → 点击「开始诊断」| 显示分步骤进度条，禁止主按钮 | P0 |
| E2E-61 | AI 失败显示 | Mock AI 失败 → 点击「开始诊断」| 显示失败卡片 + 错误信息 + 重试按钮 | P0 |
| E2E-62 | AI 重试成功 | 失败后点击「重试」| 重新触发 AI，成功后继续流程 | P0 |
| E2E-63 | 生成中返回确认 | AI 诊断中点击「←」| 显示确认弹窗「当前生成会中断，是否确认？」| P0 |
| E2E-64 | 生成中确认取消 | 显示确认弹窗 → 点击「确认返回」| 取消 AI 请求，返回上一页 | P0 |
| E2E-65 | 生成中取消确认 | 显示确认弹窗 → 点击「继续生成」| 弹窗关闭，继续 AI 生成 | P0 |

#### 11.1.8 mock AI 返回异常 JSON

| 用例 ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|--------|
| E2E-70 | AI 返回非 JSON | Mock 返回「好的，我来帮你分析」| 显示「生成内容格式异常」+ 重试按钮 | P1 |
| E2E-71 | AI 返回空 script | Mock 返回 `{ script: "" }` | 显示「生成内容为空」+ 重试按钮 | P1 |

#### 11.1.9 页面刷新恢复

| 用例 ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|--------|
| E2E-80 | 刷新恢复素材 | 输入素材 → 刷新 → 查看输入框 | 内容恢复 | P0 |
| E2E-81 | 刷新恢复项目状态 | 选择前提 → 刷新 → 查看选中态 | 前提保持选中，跳转到前提页 | P0 |
| E2E-82 | 刷新恢复草稿 | 编辑草稿 → 刷新 → 查看草稿内容 | 内容恢复 | P0 |
| E2E-83 | 项目不存在时刷新 | 删除项目后访问详情页 URL | 跳转项目列表页 | P1 |

#### 11.1.10 空输入 / 短输入 / 长输入

| 用例 ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|--------|
| E2E-90 | 空素材提交 | 不输入直接点击「开始诊断」| 按钮禁用或提示输入内容 | P0 |
| E2E-91 | 极短素材（< 10字）| 输入「相亲」→ 点击「开始诊断」| 显示「素材太短，无法分析」| P0 |
| E2E-92 | 偏短素材（10-30字）| 输入「相亲对象迟到半小时」→ 开始诊断 | 显示警告「素材越具体，结果越好」| P1 |
| E2E-93 | 正常素材（> 30字）| 输入「上周相亲，对方迟到半小时...」→ 诊断 | 正常诊断流程 | P0 |
| E2E-94 | 接近上限素材（500字）| 输入 500 字素材 → 诊断 | 正常处理 | P1 |
| E2E-95 | 超过上限素材 | 输入 600 字 → 查看提示 | 显示「最多 500 字」| P0 |

### 11.2 单元测试用例（Vitest）

#### 11.2.1 JSON 解析

| 用例 ID | 输入 | 预期结果 |
|---------|------|---------|
| JSON-01 | `'{"title":"test"}'` | 解析成功 |
| JSON-02 | `'\`\`\`json\n{"title":"test"}\n\`\`\`'` | 提取 JSON 后解析成功 |
| JSON-03 | `'这不是 JSON'` | 解析失败，返回 error |
| JSON-04 | `'{"title": undefined}'` | JSON 解析成功，Zod 校验失败 |
| JSON-05 | `'{title: "test"}'`（缺少引号）| 解析失败 |

#### 11.2.2 防抖逻辑

| 用例 ID | 场景 | 预期结果 |
|---------|------|---------|
| DEB-01 | 连续输入，3 秒内再次输入 | 不触发保存 |
| DEB-02 | 停止输入 3 秒 | 触发保存 |
| DEB-03 | 输入后立即刷新页面 | 已触发保存则执行，未触发则不执行 |

#### 11.2.3 重试逻辑

| 用例 ID | 场景 | 预期结果 |
|---------|------|---------|
| RETRY-01 | AI 返回 JSON 解析失败，maxRetries=2 | 重试 2 次后抛出错误 |
| RETRY-02 | AI 超时 | 抛出超时错误 |
| RETRY-03 | 首次成功 | 无重试，直接返回 |

#### 11.2.4 Zod 表单校验

| 用例 ID | 场景 | 预期结果 |
|---------|------|---------|
| ZOD-01 | 素材 5 字 | `{ valid: false, error: "素材至少需要 10 字" }` |
| ZOD-02 | 素材 100 字 | `{ valid: true }` |
| ZOD-03 | 素材 500 字 | `{ valid: true }` |
| ZOD-04 | 素材 501 字 | `{ valid: false, error: "素材最多 500 字" }` |

### 11.3 测试覆盖率目标

| 模块 | 覆盖率目标 |
|------|-----------|
| JSON 解析（lib/json-parser.ts）| ≥ 90% |
| 防抖逻辑（lib/debounce.ts）| ≥ 90% |
| 重试逻辑（lib/retry.ts）| ≥ 90% |
| Zod schemas（lib/zod-schemas.ts）| ≥ 90% |
| Zustand stores | ≥ 70% |
| 组件交互 | E2E 覆盖 |

---

## 12. 进入静态 Demo 前需要确认的问题

### 12.1 技术栈确认

| # | 问题 | 选项 | 建议 |
|---|------|------|------|
| T1 | 是否采用 Supabase 作为数据库和 Edge Functions 平台？ | A. 是 B. 否（用其他方案）| 建议 A — 免费额度充足，与 Next.js 集成简单 |
| T2 | 是否使用 Prisma 作为 ORM？ | A. 是 B. 否（用其他方案）| 建议 A — TypeScript 友好，迁移工具成熟 |
| T3 | 是否使用 Headless UI 作为交互组件库？ | A. 是 B. 否（完全手写）| 建议 A — 减少重复造轮子 |
| T4 | 是否引入 Framer Motion 做页面过渡动画？ | A. MVP 不做 B. MVP 做（但优先级低）| 建议 A — MVP 先做核心功能 |

### 12.2 静态 Demo 数据确认

| # | 问题 | 选项 | 建议 |
|---|------|------|------|
| D1 | Mock 数据是否使用真实素材（而非泛化的示例）？ | A. 是（用 PRD 中的相亲段子）B. 否（用泛化内容）| 建议 A — 更有代入感，便于演示 |
| D2 | Mock AI 失败率设置为多少？ | A. 0%（开发环境永远成功）B. 10%（模拟真实场景）| 建议 A — MVP 阶段减少干扰 |

### 12.3 路由与状态确认

| # | 问题 | 选项 | 建议 |
|---|------|------|------|
| R1 | 页面刷新恢复时，是否需要验证 projectId 对应的项目仍然存在？ | A. 是（不存在则跳转首页）B. 否（直接使用 localStorage 数据）| 建议 A — 防止用户删除项目后刷新导致数据不一致 |
| R2 | 「重新生成」卡片后，旧卡片是物理删除还是软删除（标记 deleted）？ | A. 物理删除 B. 软删除（保留历史版本）| 建议 A — MVP 简化，减少数据量 |

### 12.4 视觉与交互确认

| # | 问题 | 选项 | 建议 |
|---|------|------|------|
| V1 | CoachTipPanel 折叠时显示多少字符？ | A. 完整标题 + 前 50 字内容 B. 仅标题 C. 完全隐藏 | 建议 A — 让用户知道这里有更多内容 |
| V2 | loading 进度条分几步？ | A. 3 步（对齐 AI 分步骤）B. 简单百分比 | 建议 A — 更清晰的进度感知 |
| V3 | Toast 显示在哪里？ | A. 顶部（原生风格）B. 底部固定 | 建议 A — 移动端通用做法 |

### 12.5 AI 接入时机确认

| # | 问题 | 选项 | 建议 |
|---|------|------|------|
| A1 | 静态 Demo 阶段是否需要设计 Prompt 模板的具体内容？ | A. MVP 只需接口 mock，具体 prompt 后续迭代 B. MVP 需要具体 prompt 初稿 | 建议 A — prompt 是独立迭代项，静态 Demo 先跑通流程 |

---

**文档结束**

---

> 📌 **下一步：** 确认上述问题清单 → 初始化 Next.js 项目 → 开始 P0 任务开发
