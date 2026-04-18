/**
 * homeConfig.js — 首页内容外置配置文件
 *
 * 这个文件包含首页所有可定制的文案、链接和功能描述。
 * fork 部署时只需修改此文件，无需改动主组件代码。
 *
 * 国际化说明：titleKey / descKey 等以 Key 结尾的字段是 i18n key，
 * 会由 i18next 的 t() 函数翻译。不以 Key 结尾的字段为固定值，不会翻译。
 */

// ===================== Hero 区域 =====================
export const heroConfig = {
  /** 顶部徽章小标签文字 */
  badgeKey: '统一 AI 接入平台',
  /** 主标题（支持 \n 换行） */
  titleLine1Key: '统一的',
  titleLine2Key: '大模型接口网关',
  /** 副标题说明 */
  subtitleKey: '更好的价格，更好的稳定性，只需将模型基址替换，即可访问 40+ 供应商的全部模型',
  /** 主按钮 */
  ctaPrimary: {
    textKey: '获取密钥',
    path: '/console',
  },
  /** 次按钮（如果设置了 useDocsLink: true 则使用系统配置的文档链接） */
  ctaSecondary: {
    textKey: '查看文档',
    useDocsLink: true,
  },
};

// ===================== Stats 数据条 =====================
export const statsConfig = [
  { value: '40+', labelKey: '支持供应商' },
  { value: '99.9%', labelKey: '服务可用性' },
  { value: '<100ms', labelKey: '全球延迟' },
  { value: '70%', labelKey: '节省成本' },
];

// ===================== 3 步快速接入 =====================
export const stepsConfig = {
  sectionTitleKey: '3 步快速接入',
  sectionSubtitleKey: '几分钟内即可开始使用海量 AI 模型',
  steps: [
    {
      num: '01',
      titleKey: '创建 API Key',
      descKey:
        '免费注册并在控制台生成你的 API Key，无需信用卡即可开始测试。',
    },
    {
      num: '02',
      titleKey: '替换 Base URL',
      descKey:
        '将你的 API 请求基址替换为本平台节点，OpenAI SDK 用户只需改一行代码。',
    },
    {
      num: '03',
      titleKey: '开始调用模型',
      descKey:
        '使用 OpenAI 兼容格式，通过统一接口访问 GPT、Claude、Gemini、DeepSeek 等 40+ 供应商的所有模型。',
    },
  ],
  ctaPrimary: {
    textKey: '获取 API Key',
    path: '/console',
  },
  ctaSecondary: {
    textKey: '查看文档',
    useDocsLink: true,
  },
};

// ===================== 为什么选择我们 =====================
export const featuresConfig = {
  sectionTitleKey: '为什么选择我们',
  sectionSubtitleKey: '一站式 AI API 平台，让你专注于产品而非基础设施',
  features: [
    {
      num: '01',
      titleKey: '多供应商聚合',
      descKey:
        '单一 API 接入 40+ AI 供应商，涵盖 OpenAI、Claude、Gemini、DeepSeek、Qwen 等，告别多套 Key 管理。',
    },
    {
      num: '02',
      titleKey: '按量计费',
      descKey:
        '用多少付多少，透明的每次请求定价，无月费订阅，无最低消费要求，支持预充值和额度管理。',
    },
    {
      num: '03',
      titleKey: '高可用负载均衡',
      descKey:
        '智能路由自动选择最优节点，99.9% SLA 可用性保障，自动故障转移，实时监控性能指标。',
    },
    {
      num: '04',
      titleKey: '低于竞品的价格',
      descKey:
        '与直连官方 API 相比最高节省 70% 成本，批量折扣自动应用，无隐性费用。',
    },
    {
      num: '05',
      titleKey: 'OpenAI 完全兼容',
      descKey:
        'OpenAI API 直接替换，100% 兼容。不需要修改代码逻辑，直接换 Base URL 即可迁移现有应用。',
    },
    {
      num: '06',
      titleKey: '完善的管理功能',
      descKey:
        '多用户多团队权限管理、调用日志、用量统计、充值管理，以及完整的 API 使用详情，一目了然。',
    },
  ],
};

// ===================== 热门模型展示 =====================
export const modelShowcaseConfig = {
  sectionTitleKey: '热门 AI 模型',
  sectionSubtitleKey: '接入市场上最先进的 AI 模型，一个账号管理全部',
};

// ===================== API 类型展示 =====================
export const apiTypesConfig = {
  sectionTitleKey: '适用于各类 AI 场景的 API',
  sectionSubtitleKey: '无论是对话、图像还是语音，统一接口一站接入所有主流 AI 能力',
};

// ===================== AI 图像展示画廊 =====================
export const imageGalleryConfig = {
  sectionTitleKey: '探索 AI 图像生成能力',
  sectionSubtitleKey: '通过统一 API 接入 DALL·E、Midjourney、Flux、Stable Diffusion 等顶级图像生成模型',
};

// ===================== Logo 跑马灯 =====================
export const marqueeConfig = {
  sectionTitleKey: '支持众多大模型供应商',
};

// ===================== FAQ =====================
export const faqConfig = {
  sectionTitleKey: '常见问题',
  sectionSubtitleKey: '快速了解平台的核心功能与使用方式',
  faqs: [
    {
      qKey: '这是什么平台？提供哪些服务？',
      aKey:
        '这是一个统一的 AI API 接入平台，通过单一端点聚合 40+ 供应商的海量模型，包括 GPT、Claude、Gemini、DeepSeek 等。支持 OpenAI 兼容格式，迁移只需更改一行代码。',
    },
    {
      qKey: '支持哪些 AI 模型？',
      aKey:
        '支持市面上主流的大语言模型、图像生成模型、语音模型等，涵盖 OpenAI GPT 系列、Anthropic Claude、Google Gemini、DeepSeek、Qwen（通义千问）、文心一言、讯飞星火等 40+ 供应商的数百个模型。',
    },
    {
      qKey: '如何计费？有最低消费吗？',
      aKey:
        '完全按量付费，无月费订阅，无最低消费限制。每个模型的单价透明公示，预充值额度随用随扣，支持查看详细的调用账单。',
    },
    {
      qKey: '如何接入？技术门槛高吗？',
      aKey:
        '极低门槛。注册后生成 API Key，将你代码中的 OpenAI Base URL 改为本平台地址即可。对于 OpenAI SDK 用户，只需修改一行代码；对于原生 HTTP 调用，同样只需更换请求基址。',
    },
    {
      qKey: '安全吗？我的 API Key 会泄露吗？',
      aKey:
        'API Key 采用单向加密存储，传输全程 HTTPS，平台不记录请求内容。你可以随时在控制台吊销旧 Key 并生成新 Key。',
    },
    {
      qKey: '可以用于团队/企业吗？',
      aKey:
        '完全支持。平台内置多用户权限管理，可为团队成员分配独立 Key 和用量配额，支持按渠道分组计费，满足企业级管理需求。',
    },
  ],
};

// ===================== 页脚链接 =====================
export const footerConfig = {
  columns: [
    {
      titleKey: '关于我们',
      links: [
        {
          textKey: '关于项目',
          href: 'https://github.com/QuantumNous/new-api',
          external: true,
        },
        {
          textKey: '联系我们',
          href: 'https://github.com/QuantumNous/new-api/issues',
          external: true,
        },
        {
          textKey: '功能特性',
          href: 'https://github.com/QuantumNous/new-api#readme',
          external: true,
        },
      ],
    },
    {
      titleKey: '文档',
      links: [
        {
          textKey: '快速开始',
          href: 'https://docs.newapi.pro/getting-started/',
          external: true,
        },
        {
          textKey: '安装指南',
          href: 'https://docs.newapi.pro/installation/',
          external: true,
        },
        {
          textKey: 'API 文档',
          href: 'https://docs.newapi.pro/api/',
          external: true,
        },
      ],
    },
    {
      titleKey: '相关项目',
      links: [
        {
          textKey: 'One API',
          href: 'https://github.com/songquanpeng/one-api',
          external: true,
        },
        {
          textKey: 'Midjourney Proxy',
          href: 'https://github.com/novicezk/midjourney-proxy',
          external: true,
        },
        {
          textKey: 'Neko Key Tool',
          href: 'https://github.com/Calcium-Ion/neko-api-key-tool',
          external: true,
        },
      ],
    },
    {
      titleKey: '资源',
      links: [
        {
          textKey: '问题反馈',
          href: 'https://github.com/QuantumNous/new-api/issues',
          external: true,
        },
        {
          textKey: 'Releases',
          href: 'https://github.com/QuantumNous/new-api/releases',
          external: true,
        },
        {
          textKey: 'Docker Hub',
          href: 'https://hub.docker.com/r/justsong/new-api',
          external: true,
        },
      ],
    },
  ],
};
