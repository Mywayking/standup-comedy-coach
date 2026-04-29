// Mock data for static demo — based on the real material:
// "我小时候很讨厌我外公，他偏心特别厉害，给我表哥买自行车，不给我买。他说因为我是外孙，是外面的孙子。"

import type { Diagnosis, WorkflowCard, Project, CoachReview } from '@/types'

export const mockDiagnosis: Diagnosis = {
  summary: '这个素材讲的是外公对孙子和外孙的双标对待，你的"外孙"身份成了被歧视的理由。',
  conflict: {
    label: '血缘歧视 vs 委屈不服',
    description: '外公用"外孙"身份正当化了偏心，而你不服气的是：同样是孙子，为什么待遇天差地别。',
    why_this_works: '每个人都有被偏心伤害过的经历，这个段子能引发强烈共鸣。'
  },
  emotion: {
    primary: '委屈',
    secondary: ['不服气', '自嘲', '无奈', '愤怒']
  },
  comedicPotential: 4,
  estimatedLength: '约 1 分钟'
}

export const mockPremises: WorkflowCard[] = [
  {
    id: 'premise-1',
    projectId: 'proj-1',
    stepType: 'premise',
    title: '「外孙」这个身份的荒谬',
    content: '从"外孙"这个称呼本身入手，讨论为什么一个血缘关系要加上"外"字，像是在说"你是外人"。',
    metadata: {
      why_it_works: '从概念入手，容易引发共鸣，大家都会想"对啊，为什么外孙就是外人？"',
      coach_tip: '可以从自己的经历扩展到整个"外孙群体"，制造更大的共鸣',
      next_question: '你身边还有其他"外孙"朋友吗？他们有类似经历吗？',
      tags: ['身份认同', '家庭关系', '概念吐槽']
    },
    selected: false,
    favorite: false,
    editable: false,
    order: 0,
    createdBy: 'ai',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'premise-2',
    projectId: 'proj-1',
    stepType: 'premise',
    title: '量化外公的小气',
    content: '把外公给表哥的和不给你的，精确到数字：自行车 vs 糖葫芦，让你算一笔"歧视账"。',
    metadata: {
      why_it_works: '数字对比让委屈变成荒谬，把情感转化为可量化的荒诞',
      coach_tip: '数字要具体，但结论要荒谬，比如"这辆自行车=我吃了100根糖葫芦"',
      next_question: '外公还做过哪些让你觉得不公平的事？',
      tags: ['量化吐槽', '家庭偏心', '数字梗']
    },
    selected: false,
    favorite: false,
    editable: false,
    order: 0,
    createdBy: 'ai',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'premise-3',
    projectId: 'proj-1',
    stepType: 'premise',
    title: '外公的偏心逻辑',
    content: '外公的逻辑是：孙子是"自家人"，外孙是"外人"。但问题是，外公对姥姥那边的孙子也这么偏心吗？',
    metadata: {
      why_it_works: '把外公的逻辑推演到荒谬的尽头，发现他自己也是"外孙"',
      coach_tip: '可以用"辈辈传"的方式，追溯外公自己小时候是否也被偏心对待',
      next_question: '外公自己有没有被偏心对待过？他知道这种感受吗？',
      tags: ['逻辑反转', '辈辈传', '家庭关系']
    },
    selected: false,
    favorite: false,
    editable: false,
    order: 0,
    createdBy: 'ai',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// Each premise has 3 angles
export const mockAnglesByPremise: Record<string, WorkflowCard[]> = {
  'premise-1': [
    {
      id: 'angle-1-1',
      projectId: 'proj-1',
      stepType: 'angle',
      title: '从"外"字的委屈切入',
      content: '小时候第一次听到"外孙"这个词，就觉得不对劲。外公，你是在说我"外"吗？',
      metadata: {
        why_it_works: '用第一人称的委屈感引发观众同情，结尾反问增加互动感',
        coach_tip: '语气要有小孩子的天真感，不要太愤怒，像是在撒娇式控诉',
        next_question: '当时你几岁？外公知道你介意这个称呼吗？',
        tags: ['身份认同', '委屈感'],
        potential_label: 'high'
      },
      selected: false,
      favorite: false,
      editable: false,
      order: 0,
      createdBy: 'ai',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'angle-1-2',
      projectId: 'proj-1',
      stepType: 'angle',
      title: '从"外人"逻辑延伸',
      content: '按照外公的标准，我回外婆家算走亲戚。那我在自己家是外人吗？',
      metadata: {
        why_it_works: '把外公的逻辑延伸到荒谬，引出"双重身份"的尴尬处境',
        coach_tip: '可以用"我到底是哪家的"这个困惑感制造幽默',
        next_question: '你小时候有没有真的把自己当外人过？',
        tags: ['身份困境', '逻辑延伸'],
        potential_label: 'medium'
      },
      selected: false,
      favorite: false,
      editable: false,
      order: 0,
      createdBy: 'ai',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'angle-1-3',
      projectId: 'proj-1',
      stepType: 'angle',
      title: '从全国外孙联盟出发',
      content: '中国有多少外孙？我们是一个被忽视的群体。外公，你知道我们有多委屈吗？',
      metadata: {
        why_it_works: '把个人经历上升到群体议题，有一种"控诉"的仪式感',
        coach_tip: '可以假装在做"外孙代表大会发言"，增加表演感',
        next_question: '你身边有多少外孙？你们会交流被偏心的经历吗？',
        tags: ['群体视角', '仪式感'],
        potential_label: 'low'
      },
      selected: false,
      favorite: false,
      editable: false,
      order: 0,
      createdBy: 'ai',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  'premise-2': [
    {
      id: 'angle-2-1',
      projectId: 'proj-1',
      stepType: 'angle',
      title: '算一笔自行车 vs 糖葫芦账',
      content: '表哥的自行车值300块，我的糖葫芦值3块。外公，你这是歧视还是通货膨胀？',
      metadata: {
        why_it_works: '把委屈变成数学题，用精确的数字对比制造荒谬感',
        coach_tip: '数字要具体，但结论要荒谬，让观众在笑声中算清楚这笔账',
        next_question: '外公后来有没有"补偿"过你？',
        tags: ['数字梗', '冷幽默'],
        potential_label: 'high'
      },
      selected: false,
      favorite: false,
      editable: false,
      order: 0,
      createdBy: 'ai',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'angle-2-2',
      projectId: 'proj-1',
      stepType: 'angle',
      title: '从"外公的经济学"切入',
      content: '外公给我表哥买自行车，表面上是亲情，实际上是在做家庭投资——回报率更高。',
      metadata: {
        why_it_works: '用经济学解释家庭关系，冷幽默但又戳中真相',
        coach_tip: '语气要冷静，像在做学术报告，但结论要荒谬',
        next_question: '外公的"投资回报"计算标准是什么？',
        tags: ['冷幽默', '讽刺'],
        potential_label: 'high'
      },
      selected: false,
      favorite: false,
      editable: false,
      order: 0,
      createdBy: 'ai',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'angle-2-3',
      projectId: 'proj-1',
      stepType: 'angle',
      title: '从"外婆的态度"找对比',
      content: '外婆对我特别好，每次去都给我做红烧肉。外公，你是不是在跟外婆对着干？',
      metadata: {
        why_it_works: '把外公外婆的态度对比，制造"家庭内战"的戏剧感',
        coach_tip: '可以想象外婆知道外公偏心后的反应，增加家庭戏剧感',
        next_question: '外婆知道你受委屈吗？她有没有说过什么？',
        tags: ['家庭关系', '对比'],
        potential_label: 'medium'
      },
      selected: false,
      favorite: false,
      editable: false,
      order: 0,
      createdBy: 'ai',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  'premise-3': [
    {
      id: 'angle-3-1',
      projectId: 'proj-1',
      stepType: 'angle',
      title: '外公自己也是"外孙"',
      content: '等等，外公你自己也有外公吧？你是不是也是"外孙"？所以这套偏心逻辑，你自己也是受害者啊。',
      metadata: {
        why_it_works: '逻辑反转，让外公从"施害者"变成"受害者"，产生共情反转',
        coach_tip: '发现真相的语气要有恍然大悟感，像是找到了家庭矛盾的根源',
        next_question: '外公小时候有没有跟你吐槽过他外公？',
        tags: ['逻辑反转', '辈辈传'],
        potential_label: 'high'
      },
      selected: false,
      favorite: false,
      editable: false,
      order: 0,
      createdBy: 'ai',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'angle-3-2',
      projectId: 'proj-1',
      stepType: 'angle',
      title: '"偏心"是祖传的吗？',
      content: '外公偏心舅舅家的孩子，姥爷偏心其他孩子。这是不是一种家族传统，一代传一代？',
      metadata: {
        why_it_works: '把个人经历上升到家族文化，有一种"寻根"的幽默感',
        coach_tip: '可以用"家训"的方式调侃，比如"我们家的家训是：孙子优先"',
        next_question: '你的父母偏心吗？你的堂兄弟姐妹呢？',
        tags: ['家族文化', '寻根'],
        potential_label: 'medium'
      },
      selected: false,
      favorite: false,
      editable: false,
      order: 0,
      createdBy: 'ai',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'angle-3-3',
      projectId: 'proj-1',
      stepType: 'angle',
      title: '外公的"合理化"借口',
      content: '外公的逻辑是：因为是外孙，所以不配。那反过来，因为是外公，你也不配对我好。这套逻辑是双向的。',
      metadata: {
        why_it_works: '用外公的逻辑反制外公，让他无法反驳',
        coach_tip: '语气要有一点"以其人之道还治其人之身"的小得意',
        next_question: '如果外公反驳你，你准备怎么回应？',
        tags: ['反制', '逻辑战'],
        potential_label: 'medium'
      },
      selected: false,
      favorite: false,
      editable: false,
      order: 0,
      createdBy: 'ai',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
}

// Each angle has 6 punchlines
export const mockPunchlinesByAngle: Record<string, WorkflowCard[]> = {
  'angle-1-1': [
    {
      id: 'pl-1-1-1', projectId: 'proj-1', stepType: 'punchline',
      title: null,
      content: '我小时候第一次听到"外孙"这个词，就觉得外公在说我"外"。我问我妈：妈，外公是不是不想要我这个外孙子？',
      metadata: { type_tag: '铺垫', placement: '前面', why_this_works: '用小孩子的天真提问开场，引发观众好奇心', coach_tip: '语气要像小孩子，天真又委屈', next_question: '你妈当时怎么回答的？' },
      selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'pl-1-1-2', projectId: 'proj-1', stepType: 'punchline',
      title: null,
      content: '我妈说：不是的，外公就是嘴硬，其实他特别疼你。我就想，妈你是不是在安慰我？',
      metadata: { type_tag: '转折', placement: '中间', why_this_works: '用妈妈的"安慰"制造反差，后面再揭穿真相', coach_tip: '这里要停顿一下，让观众以为妈妈说的是真的', next_question: '妈妈说的"嘴硬"是真的吗？' },
      selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'pl-1-1-3', projectId: 'proj-1', stepType: 'punchline',
      title: null,
      content: '直到有一天，外公给我表哥买了一辆自行车，给我买了一根糖葫芦。我才明白，外公不是嘴硬，他是真硬——硬在心眼里。',
      metadata: { type_tag: '包袱', placement: '中间', why_this_works: '自行车 vs 糖葫芦的具体对比，让委屈变得可量化', coach_tip: '说到"真硬"时要加重语气，有一种恍然大悟的快感', next_question: '糖葫芦是当场吃的吗？表哥什么反应？' },
      selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'pl-1-1-4', projectId: 'proj-1', stepType: 'punchline',
      title: null,
      content: '表哥接过自行车的时候，外公还说了一句话："你是孙子，爷爷当然要疼。"我就想，外公我叫你爷爷，你叫我什么？',
      metadata: { type_tag: 'Tag', placement: '后面', why_this_works: '用外公的身份称呼制造逻辑矛盾，让观众在笑声中体会荒谬', coach_tip: '最后一句要快，像是在"追问"，不要给观众反应时间', next_question: '外公听到这句话什么反应？' },
      selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'pl-1-1-5', projectId: 'proj-1', stepType: 'punchline',
      title: null,
      content: '后来我才明白，外公的意思是：在他的族谱里，我连名字都不配有。',
      metadata: { type_tag: 'call-back', placement: '后面', why_this_works: 'call-back 到"外孙"身份，把委屈上升到存在感的否定', coach_tip: '这句话要冷说，越冷越有力量，不要有任何情绪波动', next_question: '族谱上真的有你的名字吗？' },
      selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'pl-1-1-6', projectId: 'proj-1', stepType: 'punchline',
      title: null,
      content: '但说实话，我外公今年90了，我每次去看他，他都特别开心。所以我也不知道他到底是不是故意的。',
      metadata: { type_tag: '转场', placement: '后面', why_this_works: '反转一下，用"不知道是不是故意的"制造意外感，也给段子一个柔软的结尾', coach_tip: '这句话要和前面的愤怒形成对比，让观众感受到你对外公真实的复杂情感', next_question: '外公现在还记得那辆自行车的事吗？' },
      selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    }
  ],
  'angle-2-1': [
    {
      id: 'pl-2-1-1', projectId: 'proj-1', stepType: 'punchline',
      title: null,
      content: '我外公给我表哥买自行车那件事，我到现在都没忘。不是因为我记仇，是因为数学太好了。',
      metadata: { type_tag: '铺垫', placement: '前面', why_this_works: '用"数学好"做铺垫，让后面的数字对比更有喜剧效果', coach_tip: '说到"数学太好"时要有一点小得意', next_question: '你当时数学有多好？' },
      selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'pl-2-1-2', projectId: 'proj-1', stepType: 'punchline',
      title: null,
      content: '那辆自行车是300块钱。那根糖葫芦是3块钱。也就是说，我外公认为，表哥值300，我值3。',
      metadata: { type_tag: '包袱', placement: '中间', why_this_works: '把家庭歧视变成数学公式，让委屈变得精确又荒谬', coach_tip: '说到"表哥值300，我值3"时要有一种数学家的冷静', next_question: '3块钱的糖葫芦是什么牌子？' },
      selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'pl-2-1-3', projectId: 'proj-1', stepType: 'punchline',
      title: null,
      content: '3和300，差了100倍。这个数字让我明白了一件事：我不是外公的孙子，我是他的折扣季。',
      metadata: { type_tag: '转折', placement: '中间', why_this_works: '用"折扣季"这个比喻，把经济学的概念引入家庭关系，冷幽默', coach_tip: '说到"折扣季"时要有一种恍然大悟的快感', next_question: '外公还给你打过什么折？' },
      selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'pl-2-1-4', projectId: 'proj-1', stepType: 'punchline',
      title: null,
      content: '后来我想，也许外公是对的。表哥姓外公家的姓，我姓我妈姓。人家才是VIP会员，我是来蹭WiFi的。',
      metadata: { type_tag: 'Tag', placement: '后面', why_this_works: '用VIP会员和蹭WiFi做比喻，把家庭地位的差距具象化', coach_tip: '这个比喻要说得自然流畅，不要刻意停顿', next_question: '你爸妈知道这件事吗？' },
      selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'pl-2-1-5', projectId: 'proj-1', stepType: 'punchline',
      title: null,
      content: '但最让我难受的不是3块钱，而是外公递给我糖葫芦时说的那句话："你是外孙，将就一下。"我当场就想，外公，你这糖葫芦我不吃了，我要把这个"将就"还给你。',
      metadata: { type_tag: '包袱', placement: '后面', why_this_works: '用"将就"这个词的反制，把被动接受的委屈变成主动的反抗', coach_tip: '"还给你"三个字要重读，有一种孩子式的倔强', next_question: '糖葫芦最后吃了吗？' },
      selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'pl-2-1-6', projectId: 'proj-1', stepType: 'punchline',
      title: null,
      content: '最后还是吃了。毕竟是糖葫芦，不吃白不吃。但我在心里默默记下了这笔账：外公欠我一辆自行车。',
      metadata: { type_tag: '转场', placement: '后面', why_this_works: '用"吃了但记账"的方式，既表现了孩子的天真，又暗示了内心的不甘', coach_tip: '结尾要有一种"虽然和解但没忘记"的复杂感', next_question: '外公现在还在吗？这笔账还上了吗？' },
      selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    }
  ],
  'angle-3-1': [
    {
      id: 'pl-3-1-1', projectId: 'proj-1', stepType: 'punchline',
      title: null,
      content: '我外公偏心这件事，我小时候一直想不通。你说我表哥有什么好的？不就姓个"外公"的姓吗？',
      metadata: { type_tag: '铺垫', placement: '前面', why_this_works: '从"姓"入手，为后面的反转埋伏笔', coach_tip: '说到"外公"的姓时要有一种困惑感', next_question: '你表哥是不是也很会讨好外公？' },
      selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'pl-3-1-2', projectId: 'proj-1', stepType: 'punchline',
      title: null,
      content: '直到有一天，我翻我们家的族谱，发现了一个惊天秘密。',
      metadata: { type_tag: '转折', placement: '中间', why_this_works: '用"惊天秘密"做悬念，让观众以为会发现什么重大真相', coach_tip: '这里要停顿，制造悬念感', next_question: '族谱上写了什么？' },
      selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'pl-3-1-3', projectId: 'proj-1', stepType: 'punchline',
      title: null,
      content: '我发现，外公自己也是"外孙"。他外公姓李，他爷爷姓王。他是两边都沾不上亲的那一个。',
      metadata: { type_tag: '包袱', placement: '中间', why_this_works: '反转！外公自己也是"外人"，他自己就是偏心的受害者', coach_tip: '说到"两边都沾不上亲"时要有恍然大悟感', next_question: '外公知道他自己的身世吗？' },
      selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'pl-3-1-4', projectId: 'proj-1', stepType: 'punchline',
      title: null,
      content: '我终于明白了：外公偏心，其实是在复仇。他恨自己的"外孙"身份，所以他要把这种痛苦传给我。',
      metadata: { type_tag: 'Tag', placement: '后面', why_this_works: '用"复仇"理论把外公的偏心合理化，同时也让段子有了深度', coach_tip: '说到"传给我"时要有一种"原来如此"的悲剧感', next_question: '那外公的"仇人"是谁？' },
      selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'pl-3-1-5', projectId: 'proj-1', stepType: 'punchline',
      title: null,
      content: '所以我外公不是偏心，他是在做代际创伤传递。一个被偏心伤害过的人，学会用偏心去伤害别人。这是家族的诅咒。',
      metadata: { type_tag: 'call-back', placement: '后面', why_this_works: '把个人经历上升到家族心理学，有一种恍然大悟的深度', coach_tip: '说到"诅咒"时要慢，让观众有时间消化', next_question: '那你怎么打破这个诅咒？' },
      selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'pl-3-1-6', projectId: 'proj-1', stepType: 'punchline',
      title: null,
      content: '我打破的方式就是：我现在对我外公特别好。因为我想证明，这个诅咒到我这里就断了。而且他今年90了，自行车也骑不动了。',
      metadata: { type_tag: '转场', placement: '后面', why_this_works: '用"诅咒到我这里断了"升华主题，同时用"自行车骑不动了"做冷幽默收尾', coach_tip: '最后一句要冷，越冷越有力量', next_question: '外公知道你在做这件事吗？' },
      selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    }
  ]
}

export const mockCoachReview: CoachReview = {
  assessment: '这篇稿子整体结构清晰，从"外孙"身份切入，到自行车vs糖葫芦的具体对比，再到代际创伤的升华，情绪递进做得很好。',
  strengths: [
    '开场的"外"字委屈感很强，容易引发共鸣',
    '数字对比（300 vs 3）让委屈变得可量化',
    '最后的call-back让整篇稿子有了深度',
    '结尾用"诅咒断了"升华主题，比单纯的抱怨更有力量'
  ],
  suggestions: [
    '第二段的铺垫可以更短一些，直接进包袱',
    '可以在中间加一个外公的"内心独白"段落，增加戏剧张力',
    '注意节奏，第一遍讲的时候可以稍微快一点，Tag那里要慢'
  ],
  nextStep: '建议先对着镜子练3遍，找到自己的节奏。然后可以录视频自己看，或者去开放麦试讲。'
}

export const mockFinalScript = `我小时候特别讨厌我外公，不是因为他不疼我，是因为他疼别人的方式，让我意识到我可能不是他家的。

我表哥比我大两岁，外公给他买了一辆自行车，三百块钱。给我买了一根糖葫芦，三块钱。

我想，姥爷，咱俩差一百倍呢。

后来我才知道，外公给的理由是：你是外孙，你不是"自家人"。

我就想，姥爷，我叫你姥爷，你叫我外人，这是什么道理？

最绝的是我表哥接过自行车的时候，外公还说了一句话："你是孙子，爷爷当然要疼。"我就想说，姥爷，我叫你爷爷，你管我叫啥？

后来我翻族谱才发现一个惊天秘密——外公自己也是"外孙"。他外公姓李，他爷爷姓王，他是两边都沾不上亲的那一个。

我突然明白了：外公偏心，其实是在复仇。一个被偏心伤害过的人，学会用偏心去伤害别人。这是家族的诅咒。

但我想，这个诅咒到我这里就断了。

（完）`

export function createMockProject(): Project {
  return {
    id: 'proj-' + Date.now(),
    title: '外公偏心的故事',
    status: 'in_progress',
    material: {
      content: '我小时候很讨厌我外公，他偏心特别厉害，给我表哥买自行车，不给我买。他说因为我是外孙，是外面的孙子。'
    },
    diagnosis: null,
    premiseId: null,
    angleId: null,
    selectedPunchlineIds: [],
    finalScript: null,
    wordCountFinal: null,
    durationFinal: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}
