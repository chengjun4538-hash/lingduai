/*
Copyright (C) 2025 QuantumNous

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

const defaultSiteConfig = {
  _comment: '零度 AI 前端全局配置文件 — 默认站点配置',
  nav: {
    console: {
      label: '控制台',
      path: '/console',
    },
    chat: {
      label: '对话',
      viewAllPath: '/pricing',
      models: [
        {
          name: 'GPT-4o',
          provider: 'OpenAI',
          path: '/console',
          description: '多模态旗舰模型，支持图像理解与函数调用',
          badge: '推荐',
        },
        {
          name: 'Claude Sonnet 4.5',
          provider: 'Anthropic',
          path: '/console',
          description: '强推理·200K 超长上下文·写作代码首选',
        },
        {
          name: 'Gemini 2.0 Flash',
          provider: 'Google',
          path: '/console',
          description: '最新多模态模型，极低延迟高性价比',
        },
        {
          name: 'DeepSeek-V3',
          provider: 'DeepSeek',
          path: '/console',
          description: '国产顶级大模型，超强推理，价格极低',
          badge: '热门',
        },
        {
          name: 'Grok-3',
          provider: 'xAI',
          path: '/console',
          description: 'xAI 旗舰推理模型，支持互联网实时信息',
        },
        {
          name: 'Qwen3-235B-A22B',
          provider: '阿里云',
          path: '/console',
          description: '阿里最强开源模型，混合专家架构',
        },
        {
          name: 'o3',
          provider: 'OpenAI',
          path: '/console',
          description: 'OpenAI 顶级推理模型，擅长复杂逻辑',
        },
        {
          name: 'Claude Opus 4',
          provider: 'Anthropic',
          path: '/console',
          description: 'Anthropic 旗舰模型，顶级写作与分析',
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
          description: 'OpenAI 高质量图像生成，精准遵循指令',
        },
        {
          name: 'Flux.1',
          provider: 'Black Forest Labs',
          path: '/console',
          description: '顶级开源图像生成模型，细节极为丰富',
        },
        {
          name: 'Stable Diffusion XL',
          provider: 'Stability AI',
          path: '/console',
          description: '强大的开源图像生成，高度可定制',
        },
        {
          name: 'Midjourney',
          provider: 'Midjourney',
          path: '/console',
          description: '艺术风格领先，最受设计师青睐',
          badge: '热门',
        },
        {
          name: 'Imagen 3',
          provider: 'Google',
          path: '/console',
          description: 'Google 最新文生图，照片级真实感',
        },
        {
          name: 'Ideogram v3',
          provider: 'Ideogram',
          path: '/console',
          description: '文字渲染最准确的图像生成模型',
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
          description: 'OpenAI 文生视频旗舰，长达60秒高清视频',
        },
        {
          name: 'Kling 2.0',
          provider: '快手',
          path: '/console',
          description: '快手顶级视频生成，画面流畅自然',
          badge: '新',
        },
        {
          name: 'Wan2.1',
          provider: '阿里云',
          path: '/console',
          description: '阿里开源视频生成模型，效果领先',
        },
        {
          name: 'Veo 3',
          provider: 'Google',
          path: '/console',
          description: 'Google 最新视频生成，物理真实感极强',
        },
        {
          name: 'CogVideoX',
          provider: '智谱AI',
          path: '/console',
          description: '智谱开源视频生成，中文场景优化',
        },
      ],
    },
    docs: {
      label: '文档',
      url: '',
    },
    about: {
      label: '关于我们',
      items: [
        { label: '关于零度', url: '/about', external: false },
        { label: '联系我们', url: 'mailto:hi@lapi000.com', external: true },
      ],
    },
  },
  _home_comment: '首页配置 — 所有字段均可选，不填则使用内置默认值',
  home: {
    hero: {
      _comment:
        'Hero 区域主标题/副标题/按钮/统计数字，留空或删除字段将使用默认值',
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
    steps: {
      _comment: '3步快速接入区域',
      title: '3 步快速接入',
      subtitle: '几分钟内即可开始使用海量 AI 模型',
      items: [
        {
          num: '01',
          title: '创建 API Key',
          desc: '免费注册并在控制台生成你的 API Key，无需信用卡即可开始测试。',
        },
        {
          num: '02',
          title: '替换 Base URL',
          desc: '将你的 API 请求基址替换为本平台节点，OpenAI SDK 用户只需改一行代码。',
        },
        {
          num: '03',
          title: '开始调用模型',
          desc: '使用 OpenAI 兼容格式，通过统一接口访问 GPT、Claude、Gemini、DeepSeek 等 40+ 供应商的所有模型。',
        },
      ],
      primaryButton: { text: '获取 API Key', url: '/console' },
      secondaryButton: { text: '查看文档', useDocsLink: true },
    },
    features: {
      _comment: '为什么选择我们区域',
      title: '为什么选择我们',
      subtitle: '一站式 AI API 平台，让你专注于产品而非基础设施',
      items: [
        {
          num: '01',
          title: '多供应商聚合',
          desc: '单一 API 接入 40+ AI 供应商，涵盖 OpenAI、Claude、Gemini、DeepSeek、Qwen 等，告别多套 Key 管理。',
        },
        {
          num: '02',
          title: '按量计费',
          desc: '用多少付多少，透明的每次请求定价，无月费订阅，无最低消费要求，支持预充值和额度管理。',
        },
        {
          num: '03',
          title: '高可用负载均衡',
          desc: '智能路由自动选择最优节点，99.9% SLA 可用性保障，自动故障转移，实时监控性能指标。',
        },
        {
          num: '04',
          title: '低于竞品的价格',
          desc: '与直连官方 API 相比最高节省 70% 成本，批量折扣自动应用，无隐性费用。',
        },
        {
          num: '05',
          title: 'OpenAI 完全兼容',
          desc: 'OpenAI API 直接替换，100% 兼容。不需要修改代码逻辑，直接换 Base URL 即可迁移现有应用。',
        },
        {
          num: '06',
          title: '完善的管理功能',
          desc: '多用户多团队权限管理、调用日志、用量统计、充值管理，以及完整的 API 使用详情，一目了然。',
        },
      ],
    },
    faq: {
      _comment: '常见问题区域',
      title: '常见问题',
      subtitle: '快速了解平台的核心功能与使用方式',
      items: [
        {
          q: '这是什么平台？提供哪些服务？',
          a: '这是一个统一的 AI API 接入平台，通过单一端点聚合 40+ 供应商的海量模型，包括 GPT、Claude、Gemini、DeepSeek 等。支持 OpenAI 兼容格式，迁移只需更改一行代码。',
        },
        {
          q: '支持哪些 AI 模型？',
          a: '支持市面上主流的大语言模型、图像生成模型、语音模型等，涵盖 OpenAI GPT 系列、Anthropic Claude、Google Gemini、DeepSeek、Qwen（通义千问）、文心一言、讯飞星火等 40+ 供应商的数百个模型。',
        },
        {
          q: '如何计费？有最低消费吗？',
          a: '完全按量付费，无月费订阅，无最低消费限制。每个模型的单价透明公示，预充值额度随用随扣，支持查看详细的调用账单。',
        },
        {
          q: '如何接入？技术门槛高吗？',
          a: '极低门槛。注册后生成 API Key，将你代码中的 OpenAI Base URL 改为本平台地址即可。对于 OpenAI SDK 用户，只需修改一行代码；对于原生 HTTP 调用，同样只需更换请求基址。',
        },
        {
          q: '安全吗？我的 API Key 会泄露吗？',
          a: 'API Key 采用单向加密存储，传输全程 HTTPS，平台不记录请求内容。你可以随时在控制台吊销旧 Key 并生成新 Key。',
        },
        {
          q: '可以用于团队/企业吗？',
          a: '完全支持。平台内置多用户权限管理，可为团队成员分配独立 Key 和用量配额，支持按渠道分组计费，满足企业级管理需求。',
        },
      ],
    },
    _hiddenSections_comment:
      '可填入以下值来隐藏对应区块: marquee, modelShowcase, apiTypes, steps, features, faq',
    hiddenSections: [],
    modelShowcase: {
      _comment:
        '首页「热门 AI 模型」区块配置。title/subtitle 可覆盖标题文字；models 数组可选，不填则使用内置默认卡片（6 个）。超过调色板数量(10)的卡片会自动循环颜色，不会崩溃。',
      models: [
        {
          _comment_fields:
            'name(必填), provider(显示文字), providerKey(图标键,如 openai/claude/gemini/deepseek/grok/qwen/moonshot/volcengine), icon(lobehub icon 键,可选), tags(标签数组), desc(描述文字)',
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
          desc: '业界最强推理·200K 超长上下文·写作与代码首选',
        },
        {
          name: 'Gemini 2.0 Flash',
          provider: 'Google',
          providerKey: 'gemini',
          tags: ['对话', '快速', '多模态'],
          desc: 'Google 最新多模态模型，极低延迟高性价比',
        },
        {
          name: 'DeepSeek-V3',
          provider: 'DeepSeek',
          providerKey: 'deepseek',
          tags: ['对话', '推理', '代码'],
          desc: '国产顶级大模型，超强推理能力，价格极低',
        },
        {
          name: 'Grok-3',
          provider: 'xAI',
          providerKey: 'grok',
          tags: ['对话', '推理', '实时'],
          desc: 'Elon Musk 旗下 xAI，强推理能力与互联网实时信息',
        },
        {
          name: 'Qwen3-235B-A22B',
          provider: '阿里云',
          providerKey: 'qwen',
          tags: ['MoE', '推理', '中文'],
          desc: '阿里巴巴 MoE 混合专家架构旗舰，中文能力优异',
        },
      ],
    },
    apiTypes: {
      _comment:
        '首页 API 类型区域的 section 标题、副标题与三个 Tab 的文字内容，均可自定义',
      title: '多类型 API，一站接入',
      subtitle: 'Chat、Image、Audio 三种 API 类型，统一格式，按量计费',
      tabs: [
        {
          key: 'chat',
          label: 'Chat API',
          title: 'AI 对话 API — 接入 100+ 顶级语言模型',
          desc: '通过统一接口访问 Claude Sonnet 4.5、GPT-4o、DeepSeek-V3、Qwen3 等 100+ 顶级语言模型。与 OpenAI SDK 100% 兼容，将 Base URL 替换为本平台地址，一行代码完成迁移。支持流式输出、函数调用、视觉能力，成本节省高达 70%。',
          features: [
            '100+ 语言模型',
            'OpenAI 兼容格式',
            '流式输出',
            '函数调用',
            '视觉理解',
            '最高节省 70%',
          ],
        },
        {
          key: 'image',
          label: 'Image API',
          title: 'AI 图像 API — 多种图像生成模型一站接入',
          desc: '通过统一接口使用 DALL·E 3、Flux.1、Stable Diffusion XL、Midjourney 等顶级图像生成模型。支持文生图、图生图等多种模式，按量计费、无月费，与 OpenAI Images API 完全兼容。',
          features: [
            'DALL·E 3 / Flux.1',
            'Stable Diffusion XL',
            '文生图 & 图生图',
            'OpenAI 兼容接口',
            '高清 4K 输出',
            '按次计费',
          ],
        },
        {
          key: 'audio',
          label: 'Audio API',
          title: 'AI 语音 API — 语音识别与合成全覆盖',
          desc: '支持 Whisper 语音识别（STT）、TTS 文字转语音等多种语音模型。覆盖中英文及多语言，高精度低延迟，完全兼容 OpenAI Audio API，无缝接入现有系统。',
          features: [
            'Whisper STT',
            'TTS 文字转语音',
            '多语言支持',
            '高精度识别',
            'OpenAI 兼容',
            '实时流式处理',
          ],
        },
      ],
    },
  },
  _footer_comment: '首页页脚配置',
  footer: {
    _comment:
      'copyright: 版权文字；socials: 社交图标列表；columns: 链接列；newApiLink: 是否显示底部 New API 来源（默认 true）',
    copyright: '© 2026 零度AI 保留所有权利。',
    socials: [
      { type: 'twitter', url: 'https://x.com/', label: 'Twitter / X' },
      { type: 'youtube', url: 'https://youtube.com/', label: 'YouTube' },
      { type: 'discord', url: 'https://discord.gg/', label: 'Discord' },
      { type: 'github', url: 'https://github.com/', label: 'GitHub' },
      { type: 'email', url: 'mailto:hi@example.com', label: '邮箱' },
      { type: 'wechat', qrcode: '', label: '微信' },
    ],
    columns: [
      {
        title: '热门产品',
        links: [
          { label: 'GPT-4o', url: '/pricing' },
          { label: 'Claude Opus 4', url: '/pricing' },
          { label: 'Gemini 2.0 Flash', url: '/pricing' },
          { label: 'DeepSeek-V3', url: '/pricing' },
        ],
      },
      {
        title: '公司',
        links: [
          { label: '安全合规', url: '/privacy' },
          { label: '关于我们', url: '/about' },
          { label: '联系我们', url: 'mailto:hi@example.com', external: true },
          { label: '隐私政策', url: '/privacy' },
          { label: '服务条款', url: '/agreement' },
        ],
      },
    ],
    newApiLink: true,
  },
};

export default defaultSiteConfig;
