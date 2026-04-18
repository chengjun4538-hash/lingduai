import React, { useState, useEffect } from 'react';

// AI 图像示例数据 — 使用精心设计的 CSS 渐变模拟 AI 生成图像效果
const GALLERY_ITEMS = [
  {
    id: 1,
    model: 'DALL·E 3',
    provider: 'OpenAI',
    prompt: '宇宙中漂浮的水晶宫殿，星云背景，超高细节渲染',
    gradient:
      'radial-gradient(ellipse at 30% 70%, rgba(124,58,237,0.9) 0%, transparent 55%), radial-gradient(ellipse at 75% 25%, rgba(99,102,241,0.7) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(15,23,42,1) 0%, rgba(30,27,75,1) 100%)',
    shimmer: 'rgba(167,139,250,0.3)',
    tagColor: '#818cf8',
  },
  {
    id: 2,
    model: 'Midjourney V6',
    provider: 'Midjourney',
    prompt: '赛博朋克霓虹城市，雨夜倒影，电影级光效',
    gradient:
      'radial-gradient(ellipse at 20% 80%, rgba(236,72,153,0.8) 0%, transparent 45%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.7) 0%, transparent 45%), linear-gradient(180deg, #000000, #050510)',
    shimmer: 'rgba(236,72,153,0.3)',
    tagColor: '#f472b6',
  },
  {
    id: 3,
    model: 'Flux.1-pro',
    provider: 'Black Forest Labs',
    prompt: '极地极光，玻璃屋倒影，仙境氛围，写实摄影',
    gradient:
      'radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.9) 0%, transparent 55%), radial-gradient(ellipse at 30% 60%, rgba(59,130,246,0.6) 0%, transparent 45%), linear-gradient(180deg, #020d1a, #031520)',
    shimmer: 'rgba(52,211,153,0.3)',
    tagColor: '#34d399',
  },
  {
    id: 4,
    model: 'Stable Diffusion XL',
    provider: 'Stability AI',
    prompt: '蒸汽朋克飞艇，黄金齿轮与蒸汽管道，复古工业风',
    gradient:
      'radial-gradient(ellipse at 70% 30%, rgba(251,191,36,0.8) 0%, transparent 45%), radial-gradient(ellipse at 20% 80%, rgba(180,83,9,0.7) 0%, transparent 45%), linear-gradient(180deg, #1a0d00, #0d0800)',
    shimmer: 'rgba(251,191,36,0.3)',
    tagColor: '#fbbf24',
  },
  {
    id: 5,
    model: 'Ideogram V3',
    provider: 'Ideogram',
    prompt: '未来派科技实验室，悬浮全息显示屏，蓝色荧光',
    gradient:
      'radial-gradient(ellipse at 40% 50%, rgba(14,165,233,0.7) 0%, transparent 50%), radial-gradient(ellipse at 75% 75%, rgba(99,102,241,0.6) 0%, transparent 40%), linear-gradient(180deg, #000814, #020a1a)',
    shimmer: 'rgba(14,165,233,0.3)',
    tagColor: '#0ea5e9',
  },
  {
    id: 6,
    model: 'Adobe Firefly',
    provider: 'Adobe',
    prompt: '古老神社，秋日红叶，晨雾弥漫，油画质感',
    gradient:
      'radial-gradient(ellipse at 60% 40%, rgba(245,158,11,0.7) 0%, transparent 50%), radial-gradient(ellipse at 30% 75%, rgba(239,68,68,0.5) 0%, transparent 40%), linear-gradient(160deg, #1c0d03, #0f100a)',
    shimmer: 'rgba(245,158,11,0.3)',
    tagColor: '#f97316',
  },
];

// 单个图像卡片
const GalleryCard = ({ item, isActive, onClick }) => (
  <div
    className={`gallery-card ${isActive ? 'gallery-card-active' : ''}`}
    onClick={onClick}
    role='button'
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick()}
  >
    {/* 渐变背景 */}
    <div
      className='gallery-card-bg'
      style={{ background: item.gradient }}
    />

    {/* 光晕叠层 */}
    <div
      className='gallery-card-shimmer'
      style={{ background: `radial-gradient(ellipse at 50% 50%, ${item.shimmer} 0%, transparent 70%)` }}
    />

    {/* 模型标签 */}
    <div className='gallery-card-badge' style={{ borderColor: `${item.tagColor}40`, color: item.tagColor }}>
      <span
        className='gallery-card-badge-dot'
        style={{ background: item.tagColor }}
      />
      {item.model}
    </div>

    {/* 底部提示文字 */}
    <div className='gallery-card-overlay'>
      <p className='gallery-card-provider'>{item.provider}</p>
      <p className='gallery-card-prompt'>{item.prompt}</p>
    </div>
  </div>
);

const ImageGallerySection = ({ config, t }) => {
  const [activeId, setActiveId] = useState(1);

  // 自动轮播高亮
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveId((prev) => {
        const idx = GALLERY_ITEMS.findIndex((i) => i.id === prev);
        return GALLERY_ITEMS[(idx + 1) % GALLERY_ITEMS.length].id;
      });
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className='home-section gallery-section border-b border-zinc-800'>
      <div className='home-section-inner'>
        {/* 标题区 */}
        <div className='gallery-header'>
          <span className='gallery-section-tag'>{t('AI 图像生成')}</span>
          <h2 className='home-section-title text-white' style={{ fontFamily: 'ui-serif, Georgia, serif', fontStyle: 'italic' }}>
            {t(config.sectionTitleKey)}
          </h2>
          <p className='home-section-subtitle'>{t(config.sectionSubtitleKey)}</p>
        </div>

        {/* 图像网格 */}
        <div className='gallery-grid'>
          {GALLERY_ITEMS.map((item) => (
            <GalleryCard
              key={item.id}
              item={item}
              isActive={activeId === item.id}
              onClick={() => setActiveId(item.id)}
            />
          ))}
        </div>

        {/* 底部注释 */}
        <p className='gallery-note'>
          {t('以上为 API 支持的图像生成模型示例，效果因提示词和参数而异')}
        </p>
      </div>
    </section>
  );
};

export default ImageGallerySection;
