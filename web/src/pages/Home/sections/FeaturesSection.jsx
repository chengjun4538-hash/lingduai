import React from 'react';

// APIMart 风格功能卡片配色
const FEATURE_COLORS = [
  { bg: 'linear-gradient(135deg, #ec4899, #f43f5e)',  glow: 'rgba(236,72,153,0.2)',  border: 'rgba(236,72,153,0.2)' },
  { bg: 'linear-gradient(135deg, #22d3ee, #3c77f6)',  glow: 'rgba(34,211,238,0.2)',  border: 'rgba(34,211,238,0.2)' },
  { bg: 'linear-gradient(135deg, #f97316, #f59e0b)',  glow: 'rgba(249,115,22,0.2)',  border: 'rgba(249,115,22,0.2)' },
  { bg: 'linear-gradient(135deg, #a855f7, #6366f1)',  glow: 'rgba(168,85,247,0.2)',  border: 'rgba(168,85,247,0.2)' },
  { bg: 'linear-gradient(135deg, #60a5fa, #06b6d4)',  glow: 'rgba(96,165,250,0.2)',  border: 'rgba(96,165,250,0.2)' },
  { bg: 'linear-gradient(135deg, #10b981, #14b8a6)',  glow: 'rgba(16,185,129,0.2)',  border: 'rgba(16,185,129,0.2)' },
];

const FeatureCard = ({ feature, idx, t }) => {
  const color = FEATURE_COLORS[idx % FEATURE_COLORS.length];
  return (
    <div
      className='feature-card'
      style={{
        '--card-glow': color.glow,
        '--card-border': color.border,
        background: '#111111',
        border: `1px solid #222222`,
        transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = color.border;
        e.currentTarget.style.boxShadow = `0 8px 30px ${color.glow}, 0 0 0 1px ${color.border}`;
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#222222';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* 渐变图标徽章 */}
      <div
        className='feature-num-badge'
        style={{ background: color.bg, boxShadow: `0 4px 12px ${color.glow}` }}
      >
        {feature.num}
      </div>
      <h3 className='feature-title' style={{ fontFamily: "'Montserrat', sans-serif" }}>{t(feature.titleKey)}</h3>
      <p className='feature-desc'>{t(feature.descKey)}</p>
    </div>
  );
};

const FeaturesSection = ({ config, t }) => (
  <section className='home-section features-section border-b border-zinc-200 dark:border-zinc-800'>
    <div className='home-section-inner'>
      <h2
        className='home-section-title'
        style={{ fontFamily: 'ui-serif, Georgia, serif', fontStyle: 'italic' }}
      >
        {t(config.sectionTitleKey)}
      </h2>
      <p className='home-section-subtitle'>{t(config.sectionSubtitleKey)}</p>

      <div className='features-grid'>
        {config.features.map((feature, idx) => (
          <FeatureCard key={feature.num} feature={feature} idx={idx} t={t} />
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;

