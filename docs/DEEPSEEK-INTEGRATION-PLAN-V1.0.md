# DeepSeek 接入设计文档 V1.0

> **目标**: 替换 mock AI 层，保留所有 UI、流程、数据结构不变
> **限制**: 不接数据库、不做登录、不做多模型回退、不改 UI、不重构流程
> **当前状态**: 基于 mock 数据运行，主流程已人工验收通过

---

## 1. 接入目标

### 核心目标

用 DeepSeek API 替换现有的 mock 生成函数，实现真实 AI 辅助脱口秀创作。

### 非目标（边界）

- ❌ 不接数据库
- ❌ 不做登录/用户系统
- ❌ 不做多模型回退（如 DeepSeek → OpenAI）
- ❌ 不改 UI 组件
- ❌ 不重构现有流程
- ❌ 不改数据结构（WorkflowCard、Diagnosis、Project 等 TypeScript 类型不变）

### 成功标准

1. 5 个 Agent 全部接入 DeepSeek API
2. Mock fallback 在 API 失败时自动启用
3. 现有 mock 调用处改为 AI 调用
4. 页面表现与 mock 版本一致（loading 状态、超时处理等）
5. 可通过环境变量切换 mock/真实 AI

---

## 2. 接入边界

```
┌─────────────────────────────────────────────────────────────┐
│                     现有架构（不变）                          │
├─────────────────────────────────────────────────────────────┤
│  UI Layer          │ React Components (不变)                │
│  State Layer       │ Zustand Stores (不变)                   │
│  Data Types       │ TypeScript Interfaces (不变)            │
│  Routing           │ Next.js Pages (不变)                   │
├─────────────────────────────────────────────────────────────┤
│                     变更点（仅此处）                          │
├─────────────────────────────────────────────────────────────┤
│  AI Layer          │ mockData.ts → deepseek.ts             │
│                    │ 调用方式：mock → apiCall()             │
│                    │ fallback：apiCall 失败 → mock 返回     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 需要替换的 5 个 Agent

| Agent | 当前 Mock 函数 | 所在文件 | 替换后 |
|-------|---------------|----------|--------|
| material_diagnosis_agent | `mockDiagnosis` | `MaterialStep.tsx` | `deepseek.diagnosis()` |
| premise_generator_agent | `mockPremises` | `PremiseStep.tsx` | `deepseek.premises()` |
| angle_generator_agent | `mockAngles` | `AngleStep.tsx` | `deepseek.angles()` |
| punchline_generator_agent | `mockPunchlines` | `PunchlineStep.tsx` | `deepseek.punchlines()` |
| script_composer_agent | `mockFinalScript` | `DraftStep.tsx` | `deepseek.compose()` |

---

## 4. 每个 Agent 的输入 JSON

### 4.1 material_diagnosis_agent

**输入**:
```typescript
interface DiagnosisInput {
  material: string        // 用户输入的脱口秀素材（原始文本）
  wordCount: number      // 字数统计
  createdAt: string      // 时间戳
}
```

**示例**:
```json
{
  "material": "我外公特别偏心我表哥，给我表哥买好东西，我就只能看着。每次过年红包都不一样，我觉得特别不公平。",
  "wordCount": 58,
  "createdAt": "2026-04-30T11:30:00.000Z"
}
```

### 4.2 premise_generator_agent

**输入**:
```typescript
interface PremiseInput {
  material: string       // 原始素材
  diagnosis: Diagnosis   // 诊断结果
}
```

**示例**:
```json
{
  "material": "我外公特别偏心我表哥，给我表哥买好东西，我就只能看着。每次过年红包都不一样，我觉得特别不公平。",
  "diagnosis": {
    "coreTopic": "外公偏心",
    "topicAnalysis": "用户讲述的是家庭内部差别对待的委屈感",
    "comedyType": "自嘲式幽默",
    "difficulty": "medium",
    "suggestedApproach": "从委屈感入手，通过反转制造笑点"
  }
}
```

### 4.3 angle_generator_agent

**输入**:
```typescript
interface AngleInput {
  material: string       // 原始素材
  diagnosis: Diagnosis   // 诊断结果
  premise: Premise       // 已选前提
}
```

**示例**:
```json
{
  "material": "我外公特别偏心我表哥...",
  "diagnosis": { ... },
  "premise": {
    "id": "premise-1",
    "title": "偏心的本质是教育失败",
    "content": "外公偏心其实是一种错误的教育方式...",
    "theme": "家庭教育"
  }
}
```

### 4.4 punchline_generator_agent

**输入**:
```typescript
interface PunchlineInput {
  material: string       // 原始素材
  diagnosis: Diagnosis   // 诊断结果
  premise: Premise      // 已选前提
  angle: Angle          // 已选角度
}
```

**示例**:
```json
{
  "material": "我外公特别偏心我表哥...",
  "diagnosis": { ... },
  "premise": { ... },
  "angle": {
    "id": "angle-1",
    "title": "外公在用实际行动教我什么叫\"差别对待\"",
    "content": "外公的偏心行为实际上是一种负面教育..."
  }
}
```

### 4.5 script_composer_agent

**输入**:
```typescript
interface ScriptInput {
  material: string               // 原始素材
  diagnosis: Diagnosis           // 诊断结果
  premise: Premise               // 已选前提
  angle: Angle                   // 已选角度
  punchlines: Punchline[]        // 已选包袱（排序后）
}
```

**示例**:
```json
{
  "material": "我外公特别偏心我表哥...",
  "diagnosis": { ... },
  "premise": { ... },
  "angle": { ... },
  "punchlines": [
    {
      "id": "pl-angle1-1",
      "content": "外公对我表哥特别好，给我就差很多...",
      "metadata": { "type_tag": "铺垫", "placement": "前面" }
    },
    {
      "id": "pl-angle1-2",
      "content": "我就想，这是现实版的\"同人不同命\"...",
      "metadata": { "type_tag": "包袱", "placement": "中间" }
    }
  ]
}
```

---

## 5. 每个 Agent 的输出 JSON Schema

### 5.1 material_diagnosis_agent

**输出**:
```typescript
interface DiagnosisOutput {
  coreTopic: string           // 核心话题（10字内）
  topicAnalysis: string       // 话题分析（50字内）
  comedyType: string          // 适合的喜剧类型
  difficulty: 'easy' | 'medium' | 'hard'
  suggestedApproach: string   // 建议创作路径（80字内）
  keywords: string[]          // 关键词（3-5个）
  estimatedDuration: string   // 预估时长
}
```

**示例**:
```json
{
  "coreTopic": "外公偏心",
  "topicAnalysis": "用户通过外公对表哥的偏心来表达委屈，核心情绪是无奈和自嘲",
  "comedyType": "自嘲式幽默 + 反转",
  "difficulty": "medium",
  "suggestedApproach": "从\"委屈\"出发，通过反转\"偏心其实是教育失败\"来制造笑点",
  "keywords": ["偏心", "红包", "外公", "表哥", "不公平"],
  "estimatedDuration": "3-5分钟"
}
```

### 5.2 premise_generator_agent

**输出**:
```typescript
interface PremiseOutput {
  premises: Premise[]
}

interface Premise {
  id: string
  title: string           // 前提标题（20字内）
  content: string        // 前提内容（100字内）
  theme: string          // 主题分类
  comedyPotential: string  // 喜剧潜力说明
}
```

**示例**:
```json
{
  "premises": [
    {
      "id": "premise-1",
      "title": "偏心的本质是教育失败",
      "content": "外公偏心其实是一种错误的教育方式——用实际行动告诉孩子什么叫不公平",
      "theme": "家庭教育",
      "comedyPotential": "把\"偏心\"包装成\"错误教育\"，讽刺中有反思"
    },
    {
      "id": "premise-2",
      "title": "红包是家庭的晴雨表",
      "content": "红包金额差异反映了家庭地位的层级，外孙永远是底层",
      "theme": "家庭关系",
      "comedyPotential": "用\"红包经济学\"解读家庭关系，共鸣感强"
    }
  ]
}
```

### 5.3 angle_generator_agent

**输出**:
```typescript
interface AngleOutput {
  angles: Angle[]
}

interface Angle {
  id: string
  title: string           // 角度标题（25字内）
  content: string         // 角度内容（80字内）
  hook: string            // 切入点
  structure: string       // 建议结构
}
```

**示例**:
```json
{
  "angles": [
    {
      "id": "angle-1",
      "title": "外公在用实际行动教我什么叫\"差别对待\"",
      "content": "外公的偏心行为实际上是在身体力行地演示社会不公平",
      "hook": "用\"教育\"包装\"偏心\"，产生冷幽默",
      "structure": "开场→铺垫偏心→反转教育→笑点"
    }
  ]
}
```

### 5.4 punchline_generator_agent

**输出**:
```typescript
interface PunchlineOutput {
  punchlines: Punchline[]
}

interface Punchline {
  id: string
  content: string              // 包袱内容
  metadata: {
    type_tag: '铺垫' | '转折' | '包袱' | 'Tag' | 'call-back' | '转场'
    placement: '前面' | '中间' | '后面'
    why_this_works: string      // 笑点分析
    coach_tip: string           // 表演提示
    next_question: string       // 衔接问题
  }
}
```

**示例**:
```json
{
  "punchlines": [
    {
      "id": "pl-1",
      "content": "外公总说\"你是外孙\"，我就想，那我叫你外公，你叫我什么？叫\"那个谁\"？",
      "metadata": {
        "type_tag": "Tag",
        "placement": "后面",
        "why_this_works": "用称呼的逻辑矛盾制造笑点",
        "coach_tip": "最后一句要快，像在追问，不要停顿",
        "next_question": "外公怎么回应你的追问？"
      }
    }
  ]
}
```

### 5.5 script_composer_agent

**输出**:
```typescript
interface ScriptOutput {
  script: string           // 完整脱口秀稿
  wordCount: number        // 字数
  duration: string         // 预估时长
  structure: {
    opening: string        // 开场（50字）
    buildup: string        // 铺垫（100字）
    punchline1: string     // 笑点1（30字）
    escalation: string     // 递进（50字）
    punchline2: string     // 笑点2（30字）
    ending: string         // 结尾（30字）
  }
  coachNotes: string        // 教练备注
}
```

**示例**:
```json
{
  "script": "我外公特别偏心我表哥……（完整稿约400字）",
  "wordCount": 387,
  "duration": "约78秒",
  "structure": {
    "opening": "今天聊聊我外公，他是我见过最\"公平\"的人——公平地偏心我表哥。",
    "buildup": "每次过年，外公给表哥的红包是我的两倍。我妈说\"因为表哥是孙子\"，我就想，那\"外孙\"是什么，\"外人\"吗？",
    "punchline1": "外公对我表哥特别好，给我就差很多。我就想，这是不是外公用实际行动告诉我什么叫\"差别对待\"？",
    "escalation": "后来我明白了，外公的偏心其实是一种\"传统\"。就像过年红包，外孙永远比孙子少一半——这不是偏心，这是\"非物质文化遗产\"。",
    "punchline2": "每次外公给我表哥买好东西，我就只能看着。我就想，这是现实版的\"同人不同命\"，只不过\"同人\"是亲戚，\"不同命\"是真的。",
    "ending": "但说实话，外公对我也不差。只是那种\"不差\"，像是餐厅里的\"免费小菜\"——有也行，没有也行。"
  },
  "coachNotes": "开场要有亲和力，笑点1适合用冷幽默的语调，笑点2节奏要快，结尾要温和收尾。"
}
```

---

## 6. 每个 Agent 的 Prompt 草案

### 6.1 material_diagnosis_agent

```
## 角色
你是一个脱口秀创作教练，擅长分析用户的素材，找出适合做成段子的切入点。

## 任务
分析用户提供的脱口秀素材，输出诊断结果。

## 输出要求
JSON格式，包含：
- coreTopic: 核心话题（10字内）
- topicAnalysis: 话题分析（50字内）
- comedyType: 适合的喜剧类型
- difficulty: 难度等级（easy/medium/hard）
- suggestedApproach: 建议创作路径（80字内）
- keywords: 关键词数组（3-5个）
- estimatedDuration: 预估时长

## 注意事项
1. 脱口秀素材通常来自个人经历，情绪真实
2. 好的段子往往从"委屈"或"尴尬"出发
3. 注意识别可能被做成"反转"的点
4. 字数控制在10-100字范围内

## 用户素材
{MATERIAL}

## 输出
```

### 6.2 premise_generator_agent

```
## 角色
你是一个脱口秀创作教练，擅长从素材中提取有喜剧潜力的"前提"。

## 任务
基于素材和诊断结果，生成3-5个有喜剧潜力的前提。

## 输入信息
### 素材
{MATERIAL}

### 诊断结果
{DIAGNOSIS}

## 输出要求
JSON格式，premises数组，每个元素包含：
- id: 唯一标识
- title: 前提标题（20字内）
- content: 前提内容（100字内）
- theme: 主题分类
- comedyPotential: 喜剧潜力说明

## 前提设计原则
1. 前提要有"争议性"或"反差感"
2. 前提应该是段子的"起点"，而不是结论
3. 每个前提适合展开不同的笑点方向
4. 优先选择有共鸣感的主题

## 输出
```

### 6.3 angle_generator_agent

```
## 角色
你是一个脱口秀创作教练，擅长从前提中发散出具体的创作角度。

## 任务
基于已选前提，生成3-5个具体的创作角度。

## 输入信息
### 素材
{MATERIAL}

### 诊断结果
{DIAGNOSIS}

### 已选前提
{PREMISE}

## 输出要求
JSON格式，angles数组，每个元素包含：
- id: 唯一标识
- title: 角度标题（25字内）
- content: 角度内容（80字内）
- hook: 切入点说明
- structure: 建议结构

## 角度设计原则
1. 角度要有"梗"或"反转"的可能性
2. 角度要具体，不要太抽象
3. 每个角度应该有独特的笑点方向
4. 好的角度能让观众"意想不到但又觉得有道理"

## 输出
```

### 6.4 punchline_generator_agent

```
## 角色
你是一个脱口秀包袱设计师，擅长创作让人发笑的金句。

## 任务
基于已选角度，生成4-6个不同类型的包袱。

## 输入信息
### 素材
{MATERIAL}

### 诊断结果
{DIAGNOSIS}

### 已选前提
{PREMISE}

### 已选角度
{ANGLE}

## 输出要求
JSON格式，punchlines数组，每个元素包含：
- id: 唯一标识
- content: 包袱内容
- metadata:
  - type_tag: 类型（铺垫/转折/包袱/Tag/call-back/转场）
  - placement: 位置（前面/中间/后面）
  - why_this_works: 笑点分析
  - coach_tip: 表演提示
  - next_question: 衔接问题

## 包袱设计原则
1. 铺垫要简洁，不要太长
2. 笑点要"意外"，不能太直白
3. Tag要短，适合做callback
4. 考虑包袱之间的节奏感

## 输出
```

### 6.5 script_composer_agent

```
## 角色
你是一个脱口秀稿子整合师，擅长把零散的素材整合成结构完整的稿子。

## 任务
基于用户选择的包袱，整合成一段完整的脱口秀稿。

## 输入信息
### 素材
{MATERIAL}

### 诊断结果
{DIAGNOSIS}

### 已选前提
{PREMISE}

### 已选角度
{ANGLE}

### 已选包袱（按顺序）
{PUNCHLINES}

## 输出要求
JSON格式：
- script: 完整脱口秀稿（自然段落格式，约300-500字）
- wordCount: 字数
- duration: 预估时长
- structure:
  - opening: 开场（50字左右）
  - buildup: 铺垫（100字左右）
  - punchline1: 笑点1（30字左右）
  - escalation: 递进（50字左右）
  - punchline2: 笑点2（30字左右）
  - ending: 结尾（30字左右）
- coachNotes: 教练备注

## 稿子写作原则
1. 开场要建立"人设"，让观众知道你要讲什么
2. 铺垫要有逻辑，节奏慢一点
3. 笑点要"炸"，节奏快，声音重
4. 结尾要收住，可以有call-back
5. 整体控制在3-5分钟（300-500字）

## 输出
```

---

## 7. DeepSeek API 配置方式

### 7.1 API 端点

```
POST https://api.deepseek.com/chat/completions
```

### 7.2 请求格式

```typescript
interface DeepSeekRequest {
  model: string                    // "deepseek-chat"
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number              // 默认 0.7
  max_tokens?: number               // 默认 2000
  stream?: boolean                 // 默认 false
}
```

### 7.3 响应格式

```typescript
interface DeepSeekResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: 'assistant'
      content: string
    }
    finish_reason: 'stop' | 'length'
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}
```

---

## 8. 环境变量设计

### 8.1 必需环境变量

```env
# DeepSeek API 配置
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
DEEPSEEK_API_BASE=https://api.deepseek.com

# AI 模式切换
# "mock" = 使用 mock 数据（默认）
# "real" = 使用 DeepSeek API
# "mixed" = API 失败时 fallback 到 mock
AI_MODE=mixed
```

### 8.2 可选环境变量

```env
# 超时配置（毫秒）
AI_TIMEOUT_MS=15000

# 重试次数
AI_MAX_RETRIES=2

# 模型配置
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_TEMPERATURE=0.7
DEEPSEEK_MAX_TOKENS=2000
```

### 8.3 .env.local 示例

```env
DEEPSEEK_API_KEY=sk-your-api-key-here
DEEPSEEK_API_BASE=https://api.deepseek.com
AI_MODE=mixed
AI_TIMEOUT_MS=15000
AI_MAX_RETRIES=2
```

---

## 9. 错误处理

### 9.1 错误类型

```typescript
enum AIErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',         // 网络错误
  TIMEOUT = 'TIMEOUT',                     // 超时
  API_ERROR = 'API_ERROR',                 // API 返回错误
  PARSE_ERROR = 'PARSE_ERROR',             // JSON 解析失败
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',       // 配额超限
  UNKNOWN = 'UNKNOWN'                      // 未知错误
}

interface AIError {
  type: AIErrorType
  message: string
  originalError?: Error
}
```

### 9.2 错误处理策略

| 错误类型 | 处理策略 |
|----------|----------|
| NETWORK_ERROR | 重试 2 次，间隔 1s |
| TIMEOUT | 重试 1 次，增加超时时间 |
| API_ERROR (4xx) | 不重试，直接 fallback |
| API_ERROR (5xx) | 重试 2 次，间隔 2s |
| PARSE_ERROR | fallback mock |
| QUOTA_EXCEEDED | fallback mock，记录日志 |
| UNKNOWN | fallback mock，记录错误 |

### 9.3 错误日志

```typescript
interface AITaskLog {
  id: string
  taskType: 'diagnosis' | 'premise' | 'angle' | 'punchline' | 'script'
  input: object
  output: object | null
  error: AIError | null
  mode: 'mock' | 'real'
  timestamp: string
  duration: number  // 毫秒
}

// 错误日志输出到 console（未来可对接日志系统）
console.error('[AI Error]', {
  taskType,
  errorType: error.type,
  message: error.message,
  fallback: 'mock',
  timestamp: new Date().toISOString()
})
```

---

## 10. JSON 解析失败 Fallback

### 10.1 解析流程

```typescript
async function callAgent<T>(
  agent: AgentConfig,
  input: any,
  mockFallback: () => T
): Promise<T> {
  try {
    const response = await deepseekRequest(agent.prompt, input)
    
    // 尝试解析 JSON
    const parsed = JSON.parse(response) as T
    
    // 验证必需字段
    if (!validateOutput(parsed, agent.requiredFields)) {
      throw new Error('Missing required fields')
    }
    
    return parsed
  } catch (error) {
    // JSON 解析失败或验证失败，使用 mock
    console.warn(`[${agent.name}] Parse failed, using mock fallback`)
    return mockFallback()
  }
}
```

### 10.2 结构验证

```typescript
interface ValidationRule {
  field: string
  type: 'string' | 'number' | 'array' | 'object'
  required: boolean
  validator?: (value: any) => boolean
}

// 每个 Agent 的验证规则
const diagnosisValidation: ValidationRule[] = [
  { field: 'coreTopic', type: 'string', required: true },
  { field: 'topicAnalysis', type: 'string', required: true },
  { field: 'comedyType', type: 'string', required: true },
  { field: 'difficulty', type: 'string', required: true },
  { field: 'suggestedApproach', type: 'string', required: true },
  { field: 'keywords', type: 'array', required: true },
  { field: 'estimatedDuration', type: 'string', required: false }
]
```

---

## 11. 超时和重试策略

### 11.1 超时配置

```typescript
const DEFAULT_TIMEOUT = 15000  // 15 秒

// 各 Agent 可自定义超时
const AGENT_TIMEOUTS = {
  diagnosis: 10000,      // 诊断：10 秒
  premise: 12000,        // 前提：12 秒
  angle: 12000,          // 角度：12 秒
  punchline: 15000,     // 包袱：15 秒
  script: 20000         // 草稿：20 秒（最长）
}
```

### 11.2 重试策略

```typescript
interface RetryConfig {
  maxRetries: number
  initialDelay: number   // 毫秒
  maxDelay: number       // 毫秒
  backoffMultiplier: number
}

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 2,
  initialDelay: 1000,
  maxDelay: 4000,
  backoffMultiplier: 2
}

async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i <= config.maxRetries; i++) {
    try {
      return await Promise.race([
        fn(),
        timeout(AGENT_TIMEOUTS[agentType])
      ])
    } catch (error) {
      lastError = error
      
      if (i < config.maxRetries && isRetryable(error)) {
        const delay = Math.min(
          config.initialDelay * Math.pow(config.backoffMultiplier, i),
          config.maxDelay
        )
        await sleep(delay)
      }
    }
  }
  
  throw lastError
}

function isRetryable(error: AIError): boolean {
  return [
    AIErrorType.NETWORK_ERROR,
    AIErrorType.TIMEOUT,
    AIErrorType.API_ERROR // 仅 5xx
  ].includes(error.type)
}
```

---

## 12. 如何写入 AITaskLog

### 12.1 日志记录点

```typescript
interface AITaskLog {
  id: string
  taskType: 'diagnosis' | 'premise' | 'angle' | 'punchline' | 'script'
  input: object
  output: object | null
  error: {
    type: string
    message: string
  } | null
  mode: 'mock' | 'real'
  fallbackUsed: boolean
  timestamp: string
  duration: number
}

// 记录点 1: API 调用开始
logStore.start(taskType, input)

// 记录点 2: API 调用成功
logStore.success(taskType, output, duration)

// 记录点 3: API 调用失败
logStore.failure(taskType, error, fallbackUsed)

// 记录点 4: Fallback 触发
logStore.fallback(taskType, mockOutput)
```

### 12.2 日志存储方式

**当前阶段**: 仅输出到 console

```typescript
// src/lib/ai-logger.ts
export function logAITask(log: AITaskLog): void {
  const prefix = log.fallbackUsed ? '[AI-FALLBACK]' : '[AI]'
  console.log(`${prefix} ${log.taskType}`, {
    duration: `${log.duration}ms`,
    mode: log.mode,
    fallback: log.fallbackUsed,
    timestamp: log.timestamp
  })
}
```

**未来扩展**: 可对接 Serverless 日志服务（如阿里云日志）

---

## 13. 如何保留 Mock Fallback

### 13.1 Mock 与 Real 切换架构

```
┌─────────────────────────────────────────────────────────┐
│                    Step Components                      │
│  MaterialStep / PremiseStep / AngleStep / etc.         │
└─────────────────────┬───────────────────────────────────┘
                      │ calls
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    AI Service Layer                     │
│  src/lib/ai-service.ts                                 │
│                                                          │
│  async function generateXxx(input): Promise<Xxx> {     │
│    if (AI_MODE === 'mock') {                           │
│      return mockXxx(input)                             │
│    }                                                   │
│    if (AI_MODE === 'real' || AI_MODE === 'mixed') {   │
│      try {                                             │
│        return await deepseekXxx(input)                 │
│      } catch (error) {                                 │
│        if (AI_MODE === 'mixed') {                      │
│          console.warn('DeepSeek failed, fallback to mock')
│          return mockXxx(input)                        │
│        }                                               │
│        throw error                                     │
│      }                                                 │
│    }                                                   │
│  }                                                     │
└─────────────────────────────────────────────────────────┘
```

### 13.2 环境变量切换

```bash
# 开发阶段（使用 mock）
AI_MODE=mock

# 测试阶段（真实 API，失败则 fallback）
AI_MODE=mixed

# 生产阶段（真实 API，不 fallback）
AI_MODE=real
```

### 13.3 Mock 函数保持不变

所有现有的 mock 函数保持原样，作为 fallback 使用：

```typescript
// src/lib/mockData.ts（现有文件，不修改接口）
export function mockDiagnosis(input: DiagnosisInput): Diagnosis { ... }
export function mockPremises(input: PremiseInput): Premise[] { ... }
export function mockAngles(input: AngleInput): Angle[] { ... }
export function mockPunchlines(input: PunchlineInput): Punchline[] { ... }
export function mockScript(input: ScriptInput): ScriptOutput { ... }
```

---

## 14. 如何本地测试

### 14.1 测试环境准备

```bash
# 1. 复制环境变量模板
cp .env.example .env.local

# 2. 填写 DeepSeek API Key
echo "DEEPSEEK_API_KEY=sk-your-key" >> .env.local

# 3. 安装依赖
npm install

# 4. 启动开发服务器
npm run dev
```

### 14.2 Mock 模式测试（无需 API Key）

```bash
# .env.local
AI_MODE=mock

# 启动后访问 http://localhost:3000
# 所有 AI 调用使用 mock 数据
```

### 14.3 真实 API 测试

```bash
# .env.local
AI_MODE=real
DEEPSEEK_API_KEY=sk-your-key

# 启动后访问 http://localhost:3000
# 所有 AI 调用使用真实 DeepSeek API
```

### 14.4 Mixed 模式测试（推荐）

```bash
# .env.local
AI_MODE=mixed
DEEPSEEK_API_KEY=sk-your-key
AI_TIMEOUT_MS=5000  # 缩短超时便于测试

# 测试流程：
# 1. API 正常 → 使用真实响应
# 2. API 失败 → 自动 fallback 到 mock
```

### 14.5 单元测试

```bash
# 运行 AI 服务层测试
npm test -- src/lib/ai-service.test.ts

# 测试内容：
# 1. Mock 模式返回正确数据
# 2. Real 模式调用正确 API
# 3. 解析失败时 fallback
# 4. 超时时正确处理
```

---

## 15. 如何线上验证

### 15.1 验证检查清单

| # | 验证项 | 方法 | 通过标准 |
|---|--------|------|----------|
| 1 | API Key 配置正确 | 检查环境变量 | 无 401/403 错误 |
| 2 | 素材诊断调用成功 | 输入素材，查看控制台 | `[AI] diagnosis` 日志 |
| 3 | 前提生成调用成功 | 选择前提前 | `[AI] premise` 日志 |
| 4 | 角度发散调用成功 | 选择角度前 | `[AI] angle` 日志 |
| 5 | 包袱生成调用成功 | 选择角度后 | `[AI] punchline` 日志 |
| 6 | 草稿组合调用成功 | 点击生成草稿 | `[AI] script` 日志 |
| 7 | API 超时 fallback | 断网或配置错误 | 页面显示 mock 数据 |
| 8 | JSON 解析失败 fallback | Mock API 返回非 JSON | 页面显示 mock 数据 |
| 9 | 页面无报错 | 浏览器 console | 无红色错误 |
| 10 | Loading 状态正确 | 各步骤 AI 调用时 | 显示 loading spinner |

### 15.2 验证命令

```bash
# 查看 API 调用日志
# 浏览器控制台输入：
console.log('[AI-Verification] Ready to verify')
localStorage.setItem('DEBUG_AI', 'true')

# 然后操作流程，观察 console 输出
```

### 15.3 线上环境变量配置

在 MiniMax Agent 平台的环境变量中配置：

```
DEEPSEEK_API_KEY = sk-xxxxxxxxxxxxxxxxxxxxxxxx
DEEPSEEK_API_BASE = https://api.deepseek.com
AI_MODE = mixed
AI_TIMEOUT_MS = 15000
AI_MAX_RETRIES = 2
```

---

## 16. 分阶段实施计划

### Phase 1: 基础设施（预计 2 小时）

**目标**: 建立 AI 服务层框架

**任务**:
1. 创建 `src/lib/ai-service.ts` — AI 服务入口
2. 创建 `src/lib/deepseek.ts` — DeepSeek API 调用封装
3. 创建 `src/lib/ai-logger.ts` — 日志记录
4. 创建 `src/lib/ai-types.ts` — 类型定义
5. 配置 `.env.local` 环境变量模板

**交付物**: AI 服务层框架，mock 模式可用

**验证**: `AI_MODE=mock` 时页面功能与当前完全一致

---

### Phase 2: 单 Agent 接入（预计 4 小时）

**目标**: 接入第一个 Agent，验证流程

**任务**:
1. 选择 `punchline_generator_agent` 作为首个接入目标
2. 实现 `deepseek.punchlines()` 函数
3. 编写 prompt，调试输出质量
4. 实现 fallback 逻辑
5. 验证 `/create/punchline` 页面

**交付物**: 包袱生成使用真实 AI

**验证**:
- [ ] 页面 loading 正常
- [ ] 生成的包袱有质量
- [ ] API 失败时 fallback 到 mock

---

### Phase 3: 批量接入（预计 6 小时）

**目标**: 完成剩余 4 个 Agent 接入

**任务**:
1. 接入 `material_diagnosis_agent`
2. 接入 `premise_generator_agent`
3. 接入 `angle_generator_agent`
4. 接入 `script_composer_agent`
5. 全流程测试

**交付物**: 5 个 Agent 全部接入

**验证**:
- [ ] 素材诊断使用真实 AI
- [ ] 前提生成使用真实 AI
- [ ] 角度发散使用真实 AI
- [ ] 草稿组合使用真实 AI
- [ ] 全流程无报错

---

### Phase 4: 质量调优（预计 4 小时）

**目标**: 优化 prompt，提升生成质量

**任务**:
1. 收集 10+ 组真实素材测试
2. 分析生成质量，调整 prompt
3. 优化 `suggestedApproach` 引导后续生成
4. 优化草稿结构控制
5. 添加 coach tips 到各 Agent

**交付物**: 高质量生成结果

**验证**:
- [ ] 生成的包袱有笑点
- [ ] 草稿结构清晰
- [ ] 教练感强

---

### Phase 5: 生产部署（预计 2 小时）

**目标**: 线上验证，切换生产模式

**任务**:
1. 配置生产环境变量
2. 切换 `AI_MODE=mixed` 验证 fallback
3. 收集线上日志
4. 准备 API 配额监控
5. 切换 `AI_MODE=real`

**交付物**: 生产环境运行

**验证**:
- [ ] 线上无 5xx 错误
- [ ] API 失败自动 fallback
- [ ] 用户体验流畅

---

## 附录

### A. DeepSeek API 费用参考

| 模型 | 输入价格 | 输出价格 | 备注 |
|------|----------|----------|------|
| deepseek-chat | ¥0.001/千token | ¥0.002/千token | 2026-04 价格 |
| deepseek-coder | ¥0.001/千token | ¥0.002/千token | 代码专用 |

**预估成本**:
- 单次创作流程：约 5000-10000 tokens
- 单次成本：约 ¥0.005-0.02
- 100 次创作：约 ¥0.5-2

### B. API 配额限制

DeepSeek API 默认配额:
- 免费用户：RPM 60，TPM 100000
- 付费用户：RPM 2000+，TPM 1000000+

**建议**: 初期使用免费配额，监控使用量后考虑升级

### C. 参考资料

- [DeepSeek API 文档](https://api-docs.deepseek.com/)
- [DeepSeek 价格页面](https://deepseek.com/pricing)
- [Zustand 文档](https://zustand.docs.pmnd.rs/)
- [Next.js 环境变量](https://nextjs.org/docs/basic-features/environment-variables)
