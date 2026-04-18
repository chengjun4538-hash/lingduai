import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@douyinfe/semi-ui';

// Tab 数据
const API_TABS = [
  {
    key: 'chat',
    labelKey: 'Chat API',
    icon: '💬',
    titleKey: 'AI 对话 API — 接入 100+ 顶级语言模型',
    descKey: '通过统一接口访问 Claude Sonnet 4.5、GPT-4o、DeepSeek-V3、Qwen3 等 100+ 顶级语言模型。与 OpenAI SDK 100% 兼容，将 Base URL 替换为本平台地址，一行代码完成迁移。支持流式输出、函数调用、视觉能力，成本节省高达 70%。',
    features: ['100+ 语言模型', 'OpenAI 兼容格式', '流式输出', '函数调用', '视觉理解', '最高节省 70%'],
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #0d1b2e 100%)',
    accentColor: '#60a5fa',
    previewGradient: 'linear-gradient(135deg, rgba(96,165,250,0.15) 0%, rgba(99,102,241,0.1) 50%, rgba(0,0,0,0) 100%)',
    codeLines: [
      { tokens: [{ c:'#6b7280', t:'# 对话 API 示例' }] },
      { tokens: [{ c:'#c084fc', t:'from' }, { c:'#e2e8f0', t:' openai ' }, { c:'#c084fc', t:'import' }, { c:'#67e8f9', t:' OpenAI' }] },
      { tokens: [] },
      { tokens: [{ c:'#e2e8f0', t:'client = ' }, { c:'#67e8f9', t:'OpenAI' }, { c:'#e2e8f0', t:'(api_key=' }, { c:'#86efac', t:'"sk-..."' }, { c:'#e2e8f0', t:')' }] },
      { tokens: [{ c:'#e2e8f0', t:'resp = client.chat.completions.' }, { c:'#fbbf24', t:'create' }, { c:'#e2e8f0', t:'(' }] },
      { tokens: [{ c:'#e2e8f0', t:'    model=' }, { c:'#86efac', t:'"claude-sonnet-4-5"' }, { c:'#e2e8f0', t:',' }] },
      { tokens: [{ c:'#e2e8f0', t:'    messages=[{' }, { c:'#86efac', t:'"role"' }, { c:'#e2e8f0', t:':' }, { c:'#86efac', t:'"user"' }, { c:'#e2e8f0', t:'}]' }] },
      { tokens: [{ c:'#e2e8f0', t:')' }] },
    ],
  },
  {
    key: 'image',
    labelKey: 'Image API',
    icon: '🎨',
    titleKey: 'AI 图像 API — 多种图像生成模型一站接入',
    descKey: '通过统一接口使用 DALL·E 3、Flux.1、Stable Diffusion XL、Midjourney 等顶级图像生成模型。支持文生图、图生图等多种模式，按量计费、无月费，与 OpenAI Images API 完全兼容。',
    features: ['DALL·E 3 / Flux.1', 'Stable Diffusion XL', '文生图 & 图生图', 'OpenAI 兼容接口', '高清 4K 输出', '按次计费'],
    gradient: 'linear-gradient(135deg, #2d1b4e 0%, #1a0d2e 100%)',
    accentColor: '#a78bfa',
    previewGradient: 'linear-gradient(135deg, rgba(167,139,250,0.15) 0%, rgba(236,72,153,0.08) 50%, rgba(0,0,0,0) 100%)',
    codeLines: [
      { tokens: [{ c:'#6b7280', t:'# 图像生成示例' }] },
      { tokens: [{ c:'#c084fc', t:'from' }, { c:'#e2e8f0', t:' openai ' }, { c:'#c084fc', t:'import' }, { c:'#67e8f9', t:' OpenAI' }] },
      { tokens: [] },
      { tokens: [{ c:'#e2e8f0', t:'client = ' }, { c:'#67e8f9', t:'OpenAI' }, { c:'#e2e8f0', t:'(api_key=' }, { c:'#86efac', t:'"sk-..."' }, { c:'#e2e8f0', t:')' }] },
      { tokens: [{ c:'#e2e8f0', t:'resp = client.images.' }, { c:'#fbbf24', t:'generate' }, { c:'#e2e8f0', t:'(' }] },
      { tokens: [{ c:'#e2e8f0', t:'    model=' }, { c:'#86efac', t:'"dall-e-3"' }, { c:'#e2e8f0', t:',' }] },
      { tokens: [{ c:'#e2e8f0', t:'    prompt=' }, { c:'#86efac', t:'"赛博朋克城市夜景"' }, { c:'#e2e8f0', t:',' }] },
      { tokens: [{ c:'#e2e8f0', t:'    n=' }, { c:'#fbbf24', t:'1' }, { c:'#e2e8f0', t:', size=' }, { c:'#86efac', t:'"1024x1024"' }] },
      { tokens: [{ c:'#e2e8f0', t:')' }] },
    ],
  },
  {
    key: 'audio',
    labelKey: 'Audio API',
    icon: '🎙️',
    titleKey: 'AI 语音 API — 语音识别与合成全覆盖',
    descKey: '支持 Whisper 语音识别（STT）、TTS 文字转语音等多种语音模型。覆盖中英文及多语言，高精度低延迟，完全兼容 OpenAI Audio API，无缝接入现有系统。',
    features: ['Whisper STT', 'TTS 文字转语音', '多语言支持', '高精度识别', 'OpenAI 兼容', '实时流式处理'],
    gradient: 'linear-gradient(135deg, #1a2e1a 0%, #0d1a0d 100%)',
    accentColor: '#34d399',
    previewGradient: 'linear-gradient(135deg, rgba(52,211,153,0.15) 0%, rgba(16,185,129,0.08) 50%, rgba(0,0,0,0) 100%)',
    codeLines: [
      { tokens: [{ c:'#6b7280', t:'# 语音识别示例' }] },
      { tokens: [{ c:'#c084fc', t:'from' }, { c:'#e2e8f0', t:' openai ' }, { c:'#c084fc', t:'import' }, { c:'#67e8f9', t:' OpenAI' }] },
      { tokens: [] },
      { tokens: [{ c:'#e2e8f0', t:'client = ' }, { c:'#67e8f9', t:'OpenAI' }, { c:'#e2e8f0', t:'(api_key=' }, { c:'#86efac', t:'"sk-..."' }, { c:'#e2e8f0', t:')' }] },
      { tokens: [{ c:'#c084fc', t:'with' }, { c:'#e2e8f0', t:' open(' }, { c:'#86efac', t:'"audio.mp3"' }, { c:'#e2e8f0', t:', "rb") as f:' }] },
      { tokens: [{ c:'#e2e8f0', t:'    transcript = client.audio.transcriptions.' }, { c:'#fbbf24', t:'create' }, { c:'#e2e8f0', t:'(' }] },
      { tokens: [{ c:'#e2e8f0', t:'        model=' }, { c:'#86efac', t:'"whisper-1"' }, { c:'#e2e8f0', t:' file=f' }] },
      { tokens: [{ c:'#e2e8f0', t:'    )' }] },
    ],
  },
];

// 代码预览卡片
const CodePreview = ({ tab }) => (
  <div className='apitype-code-card' style={{ borderColor: `${tab.accentColor}30` }}>
    <div className='apitype-code-header' style={{ borderColor: `${tab.accentColor}20` }}>
      <div className='flex gap-1.5'>
        <span className='hero-code-dot' style={{ background: '#ef4444' }} />
        <span className='hero-code-dot' style={{ background: '#f59e0b' }} />
        <span className='hero-code-dot' style={{ background: '#22c55e' }} />
      </div>
      <span style={{ color: tab.accentColor, fontSize: '0.72rem', fontFamily: 'monospace' }}>quickstart.py</span>
      <div />
    </div>
    <pre className='apitype-code-body'>
      {tab.codeLines.map((line, li) => (
        <div key={li} className='apitype-code-line'>
          {line.tokens.length === 0 ? '\u00a0' : line.tokens.map((tok, ti) => (
            <span key={ti} style={{ color: tok.c }}>{tok.t}</span>
          ))}
        </div>
      ))}
    </pre>
    {/* 背景装饰 */}
    <div className='apitype-code-bg-glow' style={{
      background: `radial-gradient(ellipse at 80% 50%, ${tab.accentColor}15 0%, transparent 70%)`,
    }} />
  </div>
);

const APITypesSection = ({ config, t }) => {
  const [activeKey, setActiveKey] = useState('chat');

  // 将 config.tabs 覆盖合并到 API_TABS（只覆盖文字内容，保留视觉/代码属性）
  const tabs = API_TABS.map((tab) => {
    const override = config?.tabs?.find?.((ct) => ct.key === tab.key);
    if (!override) return tab;
    return {
      ...tab,
      ...(override.label ? { labelKey: override.label } : {}),
      ...(override.title ? { titleKey: override.title } : {}),
      ...(override.desc ? { descKey: override.desc } : {}),
      ...(override.features?.length ? { features: override.features } : {}),
    };
  });

  const activeTab = tabs.find((tab) => tab.key === activeKey);

  return (
    <section className='home-section apitype-section border-b border-zinc-200 dark:border-zinc-800'>
      <div className='home-section-inner'>
        <h2
          className='home-section-title dark:text-white'
          style={{ fontFamily: 'ui-serif, Georgia, serif', fontStyle: 'italic' }}
        >
          {t(config.sectionTitleKey)}
        </h2>
        <p className='home-section-subtitle'>{t(config.sectionSubtitleKey)}</p>

        {/* Tab 选择器 */}
        <div className='apitype-tabs'>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveKey(tab.key)}
              className={`apitype-tab-btn ${activeKey === tab.key ? 'apitype-tab-active' : ''}`}
            >
              <span className='mr-2'>{tab.icon}</span>
              {tab.labelKey}
            </button>
          ))}
        </div>

        {/* Tab 内容 */}
        {activeTab && (
          <div className='apitype-content'>
            {/* 左侧文字区 */}
            <div className='apitype-text-col'>
              <h3 className='apitype-content-title'>{t(activeTab.titleKey)}</h3>
              <p className='apitype-content-desc'>{t(activeTab.descKey)}</p>

              {/* 特性列表 */}
              <ul className='apitype-features-list'>
                {activeTab.features.map((f) => (
                  <li key={f} className='apitype-feature-item'>
                    <span
                      className='apitype-feature-check'
                      style={{ color: activeTab.accentColor }}
                    >
                      ✓
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link to='/console'>
                <Button
                  theme='solid'
                  type='primary'
                  className='!rounded-full !px-6 !mt-6'
                  size='large'
                >
                  {t('立即使用')} →
                </Button>
              </Link>
            </div>

            {/* 右侧代码卡片 */}
            <div className='apitype-preview-col'>
              <CodePreview tab={activeTab} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default APITypesSection;
