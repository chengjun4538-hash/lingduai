/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

export type HomeButtonConfig = {
  text: string
  url?: string
  useDocsLink?: boolean
}

export type HomeListItem = {
  num?: string
  title: string
  desc: string
}

export type HomeSectionConfig<T> = {
  title: string
  subtitle?: string
  items: T[]
}

export type HomeModelConfig = {
  name: string
  provider?: string
  providerKey?: string
  icon?: string
  tags?: string[]
  desc?: string
  description?: string
}

export type HomeApiTypeConfig = {
  key: string
  label?: string
  title?: string
  desc?: string
  features?: string[]
}

export type HomeFooterConfig = {
  copyright?: string
  newApiLink?: boolean
  socials?: Array<{
    type: string
    url?: string
    qrcode?: string
    label?: string
  }>
  columns?: Array<{
    title: string
    links: Array<{ label: string; url: string; external?: boolean }>
  }>
}

export type HomeNavModel = {
  name: string
  provider?: string
  path?: string
  url?: string
  description?: string
  badge?: string
}

export type HomeNavGroup = {
  label: string
  viewAllPath?: string
  models: HomeNavModel[]
}

export type HomeNavConfig = {
  console?: { label: string; path: string }
  chat?: HomeNavGroup
  image?: HomeNavGroup
  video?: HomeNavGroup
  docs?: { label: string; url?: string }
  about?: {
    label: string
    items: Array<{ label: string; url: string; external?: boolean }>
  }
}

export type SiteConfig = {
  nav: HomeNavConfig
  home: {
    hero: {
      badge: string
      titleLine1: string
      titleLine2: string
      subtitle: string
      primaryButton: HomeButtonConfig
      secondaryButton: HomeButtonConfig
      stats: Array<{ value: string; label: string; color?: string }>
    }
    marquee: { title: string }
    modelShowcase: {
      title: string
      subtitle: string
      models: HomeModelConfig[]
    }
    apiTypes: {
      title: string
      subtitle: string
      tabs: HomeApiTypeConfig[]
    }
    steps: HomeSectionConfig<HomeListItem> & {
      primaryButton: HomeButtonConfig
      secondaryButton: HomeButtonConfig
    }
    features: HomeSectionConfig<HomeListItem>
    faq: HomeSectionConfig<{ q: string; a: string }>
    hiddenSections: string[]
  }
  footer: HomeFooterConfig
}

export const defaultSiteConfig: SiteConfig = {
  nav: {
    console: { label: '控制台', path: '/console' },
    chat: {
      label: '对话',
      viewAllPath: '/pricing',
      models: [
        {
          name: 'GPT-4o',
          provider: 'OpenAI',
          path: '/console',
          description: '多模态模型，支持图像理解与工具调用',
        },
        {
          name: 'Claude Sonnet 4.5',
          provider: 'Anthropic',
          path: '/console',
          description: '适用于长上下文、写作与代码任务',
        },
        {
          name: 'Gemini 2.0 Flash',
          provider: 'Google',
          path: '/console',
          description: '兼顾低延迟和多模态能力',
        },
        {
          name: 'DeepSeek-V3',
          provider: 'DeepSeek',
          path: '/console',
          description: '适用于通用对话、推理与代码任务',
        },
      ],
    },
    image: {
      label: '图像',
      viewAllPath: '/pricing',
      models: [
        {
          name: 'DALL·E 3',
          provider: 'OpenAI',
          path: '/console',
          description: '支持文本生成图像',
        },
        {
          name: 'Flux.1',
          provider: 'Black Forest Labs',
          path: '/console',
          description: '支持多种图像生成场景',
        },
        {
          name: 'Stable Diffusion XL',
          provider: 'Stability AI',
          path: '/console',
          description: '开源图像生成模型',
        },
      ],
    },
    video: {
      label: '视频',
      viewAllPath: '/pricing',
      models: [
        {
          name: 'Sora',
          provider: 'OpenAI',
          path: '/console',
          description: '支持文本和图像生成视频',
        },
        {
          name: 'Kling',
          provider: '快手',
          path: '/console',
          description: '支持多种视频生成任务',
        },
        {
          name: 'Vidu',
          provider: '生数科技',
          path: '/console',
          description: '支持文本、图像和参考素材生成视频',
        },
      ],
    },
    docs: { label: '文档' },
    about: {
      label: '关于我们',
      items: [{ label: '关于项目', url: '/about' }],
    },
  },
  home: {
    hero: {
      badge: '统一 AI 接入平台',
      titleLine1: '统一的',
      titleLine2: '大模型接口网关',
      subtitle:
        '更好的价格，更好的稳定性，只需将模型基址替换，即可访问 40+ 供应商的全部模型',
      primaryButton: { text: '获取密钥', url: '/console' },
      secondaryButton: { text: '查看文档', useDocsLink: true },
      stats: [
        { value: '40+', label: '支持供应商', color: '#ffffff' },
        { value: '99.9%', label: '服务可用性', color: '#22c55e' },
        { value: '<100ms', label: '全球延迟', color: '#60a5fa' },
        { value: '70%', label: '节省成本', color: '#eab308' },
      ],
    },
    marquee: { title: '支持众多大模型供应商' },
    modelShowcase: {
      title: '热门 AI 模型',
      subtitle: '接入市场上最先进的 AI 模型，一个账号管理全部',
      models: [
        {
          name: 'GPT-4o',
          provider: 'OpenAI',
          providerKey: 'openai',
          tags: ['对话', '视觉', '工具调用'],
          desc: '多模态旗舰模型，支持图像理解与函数调用',
        },
        {
          name: 'Claude Sonnet 4.5',
          provider: 'Anthropic',
          providerKey: 'claude',
          tags: ['对话', '长上下文', '代码'],
          desc: '业界领先推理能力，支持超长上下文、写作与代码任务',
        },
        {
          name: 'Gemini 2.0 Flash',
          provider: 'Google',
          providerKey: 'gemini',
          tags: ['对话', '快速', '多模态'],
          desc: 'Google 多模态模型，兼顾低延迟与性价比',
        },
        {
          name: 'DeepSeek-V3',
          provider: 'DeepSeek',
          providerKey: 'deepseek',
          tags: ['对话', '推理', '代码'],
          desc: '面向推理、代码与通用对话任务的大语言模型',
        },
        {
          name: 'Grok-3',
          provider: 'xAI',
          providerKey: 'grok',
          tags: ['对话', '推理', '实时'],
          desc: '支持推理与实时信息场景的通用模型',
        },
        {
          name: 'Qwen3-235B-A22B',
          provider: '阿里云',
          providerKey: 'qwen',
          tags: ['MoE', '推理', '中文'],
          desc: '混合专家架构模型，覆盖中文与复杂推理场景',
        },
      ],
    },
    apiTypes: {
      title: '多类型 API，一站接入',
      subtitle: 'Chat、Image、Audio 三种 API 类型，统一格式，按量计费',
      tabs: [
        {
          key: 'chat',
          label: 'Chat API',
          title: 'AI 对话 API — 接入多种语言模型',
          desc: '通过统一接口访问主流语言模型，并兼容常见 OpenAI SDK 调用方式。',
          features: [
            '多种语言模型',
            'OpenAI 兼容格式',
            '流式输出',
            '函数调用',
            '视觉理解',
            '统一用量管理',
          ],
        },
        {
          key: 'image',
          label: 'Image API',
          title: 'AI 图像 API — 多种图像生成模型一站接入',
          desc: '支持文生图、图生图与多分辨率输出，使用统一接口管理调用和计费。',
          features: [
            '多种图像模型',
            '文生图与图生图',
            'OpenAI 兼容接口',
            '高清输出',
            '多档分辨率',
            '按次计费',
          ],
        },
        {
          key: 'audio',
          label: 'Audio API',
          title: 'AI 语音 API — 语音识别与合成',
          desc: '支持语音识别与文字转语音，并提供多语言和流式处理能力。',
          features: [
            '语音识别',
            '文字转语音',
            '多语言支持',
            '低延迟处理',
            'OpenAI 兼容',
            '统一用量管理',
          ],
        },
      ],
    },
    steps: {
      title: '3 步快速接入',
      subtitle: '几分钟内即可开始使用海量 AI 模型',
      items: [
        {
          num: '01',
          title: '创建 API Key',
          desc: '注册后在控制台生成 API Key，用于鉴权和用量统计。',
        },
        {
          num: '02',
          title: '替换 Base URL',
          desc: '将现有 SDK 的请求基址替换为本平台提供的接口地址。',
        },
        {
          num: '03',
          title: '开始调用模型',
          desc: '使用统一协议访问不同供应商的文本、图像、音频和视频模型。',
        },
      ],
      primaryButton: { text: '获取 API Key', url: '/console' },
      secondaryButton: { text: '查看文档', useDocsLink: true },
    },
    features: {
      title: '为什么选择我们',
      subtitle: '统一管理模型接入、计费、路由和调用记录',
      items: [
        {
          num: '01',
          title: '多供应商聚合',
          desc: '使用单一 API 管理多个模型供应商，减少重复接入和密钥维护。',
        },
        {
          num: '02',
          title: '按量计费',
          desc: '按实际调用量结算，并提供清晰的模型价格与用量记录。',
        },
        {
          num: '03',
          title: '高可用负载均衡',
          desc: '按渠道优先级和权重调度请求，并在异常时切换可用节点。',
        },
        {
          num: '04',
          title: '成本管理',
          desc: '统一配置模型倍率、固定价格和不同分组的计费策略。',
        },
        {
          num: '05',
          title: '多协议兼容',
          desc: '兼容 OpenAI、Claude、Gemini 等常见接口与原生请求格式。',
        },
        {
          num: '06',
          title: '完善的管理功能',
          desc: '提供用户、令牌、渠道、日志、额度和权限等管理能力。',
        },
      ],
    },
    faq: {
      title: '常见问题',
      subtitle: '快速了解平台的核心功能与使用方式',
      items: [
        {
          q: '这是什么平台？提供哪些服务？',
          a: '这是一个统一的 AI API 网关，可聚合多个模型供应商，并提供路由、计费和管理能力。',
        },
        {
          q: '支持哪些 AI 模型？',
          a: '具体可用模型由管理员配置的渠道决定，可在模型价格页面查看当前支持范围。',
        },
        {
          q: '如何计费？',
          a: '平台支持按 Token、按请求、按时长以及按分辨率等计费方式，实际价格以价格页为准。',
        },
        {
          q: '如何接入？',
          a: '创建 API Key 后，将 SDK 的 Base URL 和密钥替换为平台提供的值即可。',
        },
      ],
    },
    hiddenSections: [],
  },
  footer: {
    copyright: '© 2026 零度AI 保留所有权利。',
    columns: [
      {
        title: '产品',
        links: [
          { label: '模型价格', url: '/pricing' },
          { label: '控制台', url: '/console' },
        ],
      },
      {
        title: '信息',
        links: [
          { label: '关于我们', url: '/about' },
          { label: '隐私政策', url: '/privacy-policy' },
          { label: '服务条款', url: '/user-agreement' },
        ],
      },
    ],
    newApiLink: true,
  },
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function mergeConfig<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override ?? base) as T
  }

  const merged: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    const baseValue = (base as Record<string, unknown>)[key]
    merged[key] =
      isPlainObject(baseValue) && isPlainObject(value)
        ? mergeConfig(baseValue, value)
        : value
  }
  return merged as T
}

// 旧版站点将导航、首页或页脚 JSON 存放在 HomePageContent 中；其他 JSON 仍按普通正文处理。
export function parseSiteConfig(content: string): SiteConfig | null {
  if (content.trim() === '') return defaultSiteConfig
  try {
    const parsed: unknown = JSON.parse(content)
    if (
      !isPlainObject(parsed) ||
      (!isPlainObject(parsed.nav) &&
        !isPlainObject(parsed.home) &&
        !isPlainObject(parsed.footer))
    ) {
      return null
    }
    return mergeConfig(defaultSiteConfig, parsed)
  } catch {
    return null
  }
}
