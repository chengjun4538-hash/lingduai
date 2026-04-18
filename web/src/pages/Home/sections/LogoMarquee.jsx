import React from 'react';
import {
  Moonshot,
  OpenAI,
  XAI,
  Zhipu,
  Volcengine,
  Cohere,
  Claude,
  Gemini,
  Suno,
  Minimax,
  Wenxin,
  Spark,
  Qingyan,
  DeepSeek,
  Qwen,
  Midjourney,
  Grok,
  AzureAI,
  Hunyuan,
  Xinference,
} from '@lobehub/icons';

/* 供应商图标列表 */
const PROVIDER_ICONS = [
  <OpenAI key='openai' size={36} />,
  <Claude.Color key='claude' size={36} />,
  <Gemini.Color key='gemini' size={36} />,
  <DeepSeek.Color key='deepseek' size={36} />,
  <Qwen.Color key='qwen' size={36} />,
  <Grok key='grok' size={36} />,
  <Moonshot key='moonshot' size={36} />,
  <XAI key='xai' size={36} />,
  <AzureAI.Color key='azure' size={36} />,
  <Zhipu.Color key='zhipu' size={36} />,
  <Volcengine.Color key='volcengine' size={36} />,
  <Cohere.Color key='cohere' size={36} />,
  <Suno key='suno' size={36} />,
  <Minimax.Color key='minimax' size={36} />,
  <Wenxin.Color key='wenxin' size={36} />,
  <Spark.Color key='spark' size={36} />,
  <Qingyan.Color key='qingyan' size={36} />,
  <Midjourney key='midjourney' size={36} />,
  <Hunyuan.Color key='hunyuan' size={36} />,
  <Xinference.Color key='xinference' size={36} />,
];

/* 单行跑马灯 */
const MarqueeRow = ({ icons, reverse = false }) => {
  /* 复制一份icon列表以填满无缝循环 */
  const doubled = [...icons, ...icons];

  return (
    <div className='marquee-container py-3'>
      <div className={reverse ? 'animate-marquee-reverse' : 'animate-marquee'}>
        {doubled.map((icon, idx) => (
          <div
            key={idx}
            className='mx-5 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-200 grayscale hover:grayscale-0'
          >
            {icon}
          </div>
        ))}
      </div>
    </div>
  );
};

const LogoMarquee = ({ config, t }) => {
  /* 将图标分成两排 */
  const half = Math.ceil(PROVIDER_ICONS.length / 2);
  const row1 = PROVIDER_ICONS.slice(0, half);
  const row2 = PROVIDER_ICONS.slice(half);

  return (
    <section className='home-section border-b border-zinc-200 dark:border-zinc-800 py-16 md:py-20'>
      <div className='home-section-inner'>
        {/* 标题 — 衬线斜体（APIMart 风格） */}
        <p
          className='text-center text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-10'
          style={{ fontFamily: 'ui-serif, Georgia, serif', fontStyle: 'italic', letterSpacing: '0.12em' }}
        >
          {t(config.sectionTitleKey)}
        </p>

        {/* 跑马灯 */}
        <MarqueeRow icons={row1} reverse={false} />
        <MarqueeRow icons={row2} reverse={true} />
      </div>
    </section>
  );
};

export default LogoMarquee;
