import React, { useContext } from 'react';
import { Key, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '../../../hooks/common/useIsMobile';
import { StatusContext } from '../../../context/Status';
import FloatingParticles from '../../../components/common/FloatingParticles';

// 默认统计数字（可通过 site-config.json home.hero.stats 覆盖）
const DEFAULT_STATS = [
  { value: '40+',    labelKey: '支持供应商',  color: '#ffffff' },
  { value: '99.9%',  labelKey: '服务可用性',  color: '#22c55e' },
  { value: '<100ms', labelKey: '全球延迟',    color: '#60a5fa' },
  { value: '70%',    labelKey: '节省成本',    color: '#eab308' },
];

// APIMart 风格 radial glow 背景装饰
const GlowDecorations = () => (
  <div aria-hidden='true' style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
    {/* 蓝色 glow */}
    <div style={{
      position: 'absolute',
      top: '10%', left: '15%',
      width: '600px', height: '500px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(66,133,244,0.25) 0%, rgba(0,0,0,0) 70%)',
      pointerEvents: 'none',
    }} />
    {/* 紫色 glow */}
    <div style={{
      position: 'absolute',
      top: '5%', right: '10%',
      width: '500px', height: '450px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(0,0,0,0) 70%)',
      pointerEvents: 'none',
    }} />
    {/* 粉色 glow */}
    <div style={{
      position: 'absolute',
      bottom: '5%', left: '40%',
      width: '400px', height: '350px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(0,0,0,0) 70%)',
      pointerEvents: 'none',
    }} />
  </div>
);

const HeroSection = ({ config, stats: statsProp, t }) => {
  const [statusState] = useContext(StatusContext);
  const isMobile = useIsMobile();
  const docsLink = statusState?.status?.docs_link || '';

  // site-config.json home.hero.stats 覆盖默认统计数字
  // site-config 中用 label（直接文本），默认配置用 labelKey（i18n key）
  const STATS = (statsProp || DEFAULT_STATS).map((s) => ({
    value: s.value,
    labelKey: s.label ?? s.labelKey,
    color: s.color ?? '#ffffff',
  }));

  return (
    <section className='hero-section'>
      {/* APIMart 风格 Radial Glow 背景 */}
      <GlowDecorations />

      {/* APIMart 风格彩色浮动粒子 */}
      <FloatingParticles count={28} />

      {/* 主内容 — 完全居中 */}
      <div className='hero-center-wrapper'>
        {/* Badge */}
        <span className='hero-badge'>
          <span className='hero-badge-dot' />
          {t(config.badgeKey)}
        </span>

        {/* 主标题 - APIMart 风格: 白色标题 + 蓝紫渐变动画行 */}
        <h1 className='hero-center-title'>
          {t(config.titleLine1Key)}
          <span className='hero-title-gradient'>{t(config.titleLine2Key)}</span>
        </h1>

        {/* 副标题 */}
        <p className='hero-center-subtitle'>{t(config.subtitleKey)}</p>

        {/* CTA 按钮组 - APIMart 风格 */}
        <div className='hero-cta-group'>
          <Link to={config.ctaPrimary.path} className='btn-apimart-primary'>
            <Key size={16} />
            {t(config.ctaPrimary.textKey)}
          </Link>
          {config.ctaSecondary.useDocsLink && docsLink && (
            <a
              href={docsLink}
              target='_blank'
              rel='noopener noreferrer'
              className='btn-apimart-secondary'
            >
              <BookOpen size={16} />
              {t(config.ctaSecondary.textKey)}
            </a>
          )}
        </div>

        {/* APIMart 风格统计数字 - 4列彩色大字 */}
        <div className='hero-stats-row'>
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.labelKey}>
              <div className='hero-stat-item'>
                <span className='hero-stat-value' style={{ color: stat.color }}>
                  {stat.value}
                </span>
                <span className='hero-stat-label'>{t(stat.labelKey)}</span>
              </div>
              {i < STATS.length - 1 && <div className='hero-stat-sep' />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

