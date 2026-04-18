import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useIsMobile } from '../../../hooks/common/useIsMobile';

// APIMart 风格步骤序号渐变 (01=蓝紫, 02=粉紫, 03=橙黄)
const STEP_STYLES = [
  { circleBg: 'linear-gradient(135deg, #4f46e5, #7c3aed)', connColor: 'rgba(99,102,241,0.5)' },
  { circleBg: 'linear-gradient(135deg, #a855f7, #ec4899)',  connColor: 'rgba(168,85,247,0.5)' },
  { circleBg: 'linear-gradient(135deg, #f97316, #eab308)',  connColor: 'rgba(249,115,22,0.5)' },
];

const StepCard = ({ step, idx, t, total }) => {
  const style = STEP_STYLES[idx] || STEP_STYLES[0];
  const isLast = idx === total - 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1, position: 'relative' }}>
      {/* 圆形序号 + 水平连接线 (桌面端) */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center', marginBottom: 28 }}>
        {/* 左侧连接线 (非第一个) */}
        {idx > 0 && (
          <div style={{
            position: 'absolute',
            right: '50%',
            top: '50%',
            width: 'calc(50% - 40px)',
            height: '1px',
            background: `linear-gradient(to right, transparent, ${style.connColor})`,
            transform: 'translateY(-50%)',
          }} />
        )}
        {/* 右侧连接线 (非最后一个) */}
        {!isLast && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 'calc(50% - 40px)',
            height: '1px',
            background: `linear-gradient(to right, ${style.connColor}, transparent)`,
            transform: 'translateY(-50%)',
          }} />
        )}
        {/* 序号圆圈 */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: style.circleBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem', fontWeight: 800, color: '#fff',
          flexShrink: 0, zIndex: 1,
          boxShadow: `0 0 28px ${style.connColor}`,
          fontFamily: "'Montserrat', sans-serif",
        }}>
          {step.num}
        </div>
      </div>

      {/* 内容 */}
      <h3 className='step-title' style={{ fontFamily: "'Montserrat', sans-serif" }}>
        {t(step.titleKey)}
      </h3>
      <p style={{ fontSize: '0.875rem', color: '#71717a', lineHeight: 1.65, margin: 0, maxWidth: 260 }}>
        {t(step.descKey)}
      </p>
    </div>
  );
};

const StepsSection = ({ config, statusState, t }) => {
  const isMobile = useIsMobile();
  const docsLink = statusState?.status?.docs_link || '';

  return (
    <section className='home-section steps-section border-b border-zinc-200 dark:border-zinc-800'>
      <div className='home-section-inner'>
        {/* 标题 - APIMart 使用 italic 衬线字体 */}
        <h2
          className='home-section-title'
          style={{ fontFamily: 'ui-serif, Georgia, serif', fontStyle: 'italic' }}
        >
          {t(config.sectionTitleKey)}
        </h2>
        <p className='home-section-subtitle'>{t(config.sectionSubtitleKey)}</p>

        {/* 步骤卡片 - APIMart 风格水平排列 */}
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {config.steps.map((step, idx) => (
              <div key={step.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: STEP_STYLES[idx]?.circleBg || STEP_STYLES[0].circleBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', fontWeight: 800, color: '#fff',
                  marginBottom: 18,
                  fontFamily: "'Montserrat', sans-serif",
                }}>
                  {step.num}
                </div>
                <h3 className='step-title'>{t(step.titleKey)}</h3>
                <p style={{ fontSize: '0.875rem', color: '#71717a', lineHeight: 1.65, margin: 0 }}>{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', marginBottom: 0 }}>
            {config.steps.map((step, idx) => (
              <StepCard key={step.num} step={step} idx={idx} t={t} total={config.steps.length} />
            ))}
          </div>
        )}

        {/* CTA 按钮 - APIMart 风格 */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 16, justifyContent: 'center', alignItems: 'center', marginTop: 48 }}>
          <Link to={config.ctaPrimary.path} className='btn-apimart-primary'>
            <ArrowRight size={16} />
            {t(config.ctaPrimary.textKey)}
          </Link>
          {config.ctaSecondary.useDocsLink && docsLink && (
            <a
              href={docsLink}
              target='_blank'
              rel='noopener noreferrer'
              className='btn-apimart-secondary'
            >
              <BookOpen size={15} />
              {t(config.ctaSecondary.textKey)}
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default StepsSection;

