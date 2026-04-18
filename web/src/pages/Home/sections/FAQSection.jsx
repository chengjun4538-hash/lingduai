import React, { useState } from 'react';
import { IconChevronDown } from '@douyinfe/semi-icons';

const FAQItem = ({ faq, idx, t }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-300 ${
        open
          ? 'border-blue-500/30 bg-zinc-100 dark:bg-zinc-900/70'
          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
    >
      <button
        className='w-full text-left px-6 py-5 flex items-center justify-between gap-4 cursor-pointer'
        onClick={() => setOpen((v) => !v)}
      >
        <div className='flex items-center gap-4'>
          <span className='text-xs font-bold text-blue-500 dark:text-blue-400 font-mono whitespace-nowrap'>
            {String(idx + 1).padStart(2, '0')}
          </span>
          <span className='text-sm md:text-base font-medium text-zinc-900 dark:text-white'>
            {t(faq.qKey)}
          </span>
        </div>
        <span
          className={`flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180 text-blue-500 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500'}`}
        >
          <IconChevronDown size='small' />
        </span>
      </button>

      {/* 展开内容 */}
      <div
        className='overflow-hidden transition-all duration-300'
        style={{ maxHeight: open ? '400px' : '0' }}
      >
        <div className='px-6 pb-5 pl-14 md:pl-16 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed'>
          {t(faq.aKey)}
        </div>
      </div>
    </div>
  );
};

const FAQSection = ({ config, t }) => {
  return (
    <section className='home-section bg-white dark:bg-[#0a0a0a]'>
      <div className='home-section-inner'>
        {/* 标题区 — 衬线斜体（APIMart 风格） */}
        <h2
          className='home-section-title'
          style={{ fontFamily: 'ui-serif, Georgia, serif', fontStyle: 'italic' }}
        >
          {t(config.sectionTitleKey)}
        </h2>
        <p className='home-section-subtitle'>
          {t(config.sectionSubtitleKey)}
        </p>

        {/* FAQ 列表 */}
        <div className='flex flex-col gap-3 max-w-3xl mx-auto'>
          {config.faqs.map((faq, idx) => (
            <FAQItem key={idx} faq={faq} idx={idx} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
