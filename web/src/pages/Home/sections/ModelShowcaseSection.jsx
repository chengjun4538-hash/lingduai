import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@douyinfe/semi-ui';
import {
  OpenAI, Claude, Gemini, DeepSeek, Qwen, Grok, Moonshot, Volcengine,
} from '@lobehub/icons';
import { getLobeHubIcon } from '../../../helpers';

// ===================== 颜色调色板（无限循环）=====================
// 每张卡片按 index % PALETTE.length 轮换，不管有多少张卡都不会崩
const PALETTE = [
  { gradient: 'linear-gradient(135deg, rgba(16,163,127,0.18) 0%, rgba(0,0,0,0) 100%)',   border: 'rgba(52,211,153,0.22)',  tags: ['#34d399', '#818cf8', '#f59e0b'] },
  { gradient: 'linear-gradient(135deg, rgba(204,93,74,0.18) 0%, rgba(0,0,0,0) 100%)',    border: 'rgba(244,114,182,0.22)', tags: ['#f472b6', '#a78bfa', '#22d3ee'] },
  { gradient: 'linear-gradient(135deg, rgba(96,165,250,0.18) 0%, rgba(0,0,0,0) 100%)',   border: 'rgba(96,165,250,0.22)',  tags: ['#60a5fa', '#34d399', '#fbbf24'] },
  { gradient: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(0,0,0,0) 100%)',   border: 'rgba(129,140,248,0.22)', tags: ['#818cf8', '#f59e0b', '#34d399'] },
  { gradient: 'linear-gradient(135deg, rgba(226,232,240,0.10) 0%, rgba(0,0,0,0) 100%)',  border: 'rgba(226,232,240,0.16)', tags: ['#e2e8f0', '#f472b6', '#22d3ee'] },
  { gradient: 'linear-gradient(135deg, rgba(251,191,36,0.16) 0%, rgba(0,0,0,0) 100%)',   border: 'rgba(251,191,36,0.22)',  tags: ['#fbbf24', '#34d399', '#f472b6'] },
  { gradient: 'linear-gradient(135deg, rgba(167,139,250,0.16) 0%, rgba(0,0,0,0) 100%)',  border: 'rgba(167,139,250,0.22)', tags: ['#a78bfa', '#22d3ee', '#f59e0b'] },
  { gradient: 'linear-gradient(135deg, rgba(34,211,238,0.14) 0%, rgba(0,0,0,0) 100%)',   border: 'rgba(34,211,238,0.22)',  tags: ['#22d3ee', '#818cf8', '#34d399'] },
  { gradient: 'linear-gradient(135deg, rgba(249,115,22,0.14) 0%, rgba(0,0,0,0) 100%)',   border: 'rgba(249,115,22,0.22)',  tags: ['#fb923c', '#60a5fa', '#a78bfa'] },
  { gradient: 'linear-gradient(135deg, rgba(236,72,153,0.14) 0%, rgba(0,0,0,0) 100%)',   border: 'rgba(236,72,153,0.22)',  tags: ['#f472b6', '#34d399', '#818cf8'] },
];

// ===================== 硬编码默认卡片数据 =====================
const DEFAULT_MODEL_CARDS = [
  {
    name: 'GPT-4o',       provider: 'OpenAI',    providerKey: 'openai',
    tags: ['对话', '视觉', '工具调用'],
    desc: '多模态旗舰模型，支持图像理解与函数调用',
  },
  {
    name: 'Claude Sonnet 4.5', provider: 'Anthropic', providerKey: 'claude',
    tags: ['对话', '长上下文', '代码'],
    desc: '业界最强推理·200K 超长上下文·写作与代码首选',
  },
  {
    name: 'Gemini 2.0 Flash', provider: 'Google',  providerKey: 'gemini',
    tags: ['对话', '快速', '多模态'],
    desc: 'Google 最新多模态模型，极低延迟高性价比',
  },
  {
    name: 'DeepSeek-V3',  provider: 'DeepSeek', providerKey: 'deepseek',
    tags: ['对话', '推理', '代码'],
    desc: '国产顶级大模型，超强推理能力，价格极低',
  },
  {
    name: 'Grok-3',       provider: 'xAI',      providerKey: 'grok',
    tags: ['对话', '推理', '实时'],
    desc: 'Elon Musk 旗下 xAI，强推理能力与互联网实时信息',
  },
  {
    name: 'Qwen3-235B-A22B', provider: '阿里云', providerKey: 'qwen',
    tags: ['MoE', '推理', '中文'],
    desc: '阿里巴巴 MoE 混合专家架构旗舰，中文能力优异',
  },
];

// ===================== 供应商图标映射 =====================
const ICON_MAP = {
  openai:     <OpenAI size={22} />,
  claude:     <Claude.Color size={22} />,
  gemini:     <Gemini.Color size={22} />,
  deepseek:   <DeepSeek.Color size={22} />,
  grok:       <Grok size={22} />,
  qwen:       <Qwen.Color size={22} />,
  moonshot:   <Moonshot size={22} />,
  volcengine: <Volcengine.Color size={22} />,
};

// 将 site-config cards 转为内部卡片结构
const normalizeCard = (item, index) => ({
  name: item.name ?? '',
  provider: item.provider ?? '',
  providerKey: (item.providerKey ?? item.provider ?? '').toLowerCase(),
  icon: item.icon ?? null,          // lobehub icon key（可选）
  tags: Array.isArray(item.tags) ? item.tags : [],
  desc: item.desc ?? item.description ?? '',
});

// 获取图标：优先 icon key → providerKey 映射 → lobehub → 首字母 fallback
const getCardIcon = (card) => {
  if (card.icon) return getLobeHubIcon(card.icon, 22);
  if (ICON_MAP[card.providerKey]) return ICON_MAP[card.providerKey];
  // 尝试 lobehub icon（provider 名称小写连字符）
  const lobehubKey = card.providerKey.replace(/\s+/g, '-');
  const lobehubIcon = getLobeHubIcon(lobehubKey, 22);
  if (lobehubIcon) return lobehubIcon;
  return (
    <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>
      {(card.provider || card.name || '?').slice(0, 2).toUpperCase()}
    </span>
  );
};

const ModelCard = ({ card, paletteEntry, t }) => (
  <div
    className='model-card'
    style={{
      background: paletteEntry.gradient,
      borderColor: paletteEntry.border,
    }}
  >
    {/* 头部：图标+供应商 */}
    <div className='model-card-header'>
      <div className='model-card-icon'>
        {getCardIcon(card)}
      </div>
      <span className='model-card-provider'>{card.provider}</span>
    </div>

    {/* 模型名 */}
    <h3 className='model-card-name'>{card.name}</h3>

    {/* Tags */}
    <div className='model-card-tags'>
      {card.tags.map((tag, i) => {
        const color = paletteEntry.tags[i % paletteEntry.tags.length];
        return (
          <span
            key={tag}
            className='model-card-tag'
            style={{ color, borderColor: `${color}40`, background: `${color}10` }}
          >
            {tag}
          </span>
        );
      })}
    </div>

    {/* 描述 */}
    <p className='model-card-desc'>{card.desc}</p>

    {/* 试用按钮 */}
    <Link to='/console' className='model-card-cta'>
      {t('开始使用')} →
    </Link>
  </div>
);

const ModelShowcaseSection = ({ config, t }) => {
  // config.cards 来自 site-config.json（可选），缺失则用硬编码默认值
  const rawCards = Array.isArray(config?.cards) && config.cards.length > 0
    ? config.cards.map(normalizeCard)
    : DEFAULT_MODEL_CARDS;

  return (
    <section className='home-section model-showcase-section border-b border-zinc-200 dark:border-zinc-800'>
      <div className='home-section-inner'>
        <h2
          className='home-section-title dark:text-white'
          style={{ fontFamily: 'ui-serif, Georgia, serif', fontStyle: 'italic' }}
        >
          {t(config.sectionTitleKey)}
        </h2>
        <p className='home-section-subtitle'>{t(config.sectionSubtitleKey)}</p>

        <div className='model-showcase-grid'>
          {rawCards.map((card, index) => (
            <ModelCard
              key={card.name || index}
              card={card}
              paletteEntry={PALETTE[index % PALETTE.length]}
              t={t}
            />
          ))}
        </div>

        {/* 查看全部 */}
        <div className='flex justify-center mt-10'>
          <Link to='/pricing'>
            <Button
              className='!rounded-full !px-8 !border-zinc-700 hover:!border-indigo-500'
              size='large'
            >
              {t('查看全部模型')} →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ModelShowcaseSection;

