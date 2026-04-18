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

import React, { useContext, useEffect, useState } from 'react';
import { API } from '../../helpers';
import { StatusContext } from '../../context/Status';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import NoticeModal from '../../components/layout/NoticeModal';
import HeroSection from './sections/HeroSection';
import StepsSection from './sections/StepsSection';
import FeaturesSection from './sections/FeaturesSection';
import LogoMarquee from './sections/LogoMarquee';
import FAQSection from './sections/FAQSection';
import ModelShowcaseSection from './sections/ModelShowcaseSection';
import APITypesSection from './sections/APITypesSection';
import ScrollReveal from '../../components/common/ScrollReveal';
import { useHomeConfig } from '../../hooks/common/useHomeConfig';
import HomeFooter from './sections/HomeFooter';
import {
  heroConfig,
  stepsConfig,
  featuresConfig,
  marqueeConfig,
  faqConfig,
  modelShowcaseConfig,
  apiTypesConfig,
} from './homeConfig';

const Home = () => {
  const { t } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const [noticeVisible, setNoticeVisible] = useState(false);
  const isMobile = useIsMobile();
  const homeConfig = useHomeConfig();

  // 合并配置：homeConfig hook 返回 null 时（加载中）使用静态默认值
  const cfg = homeConfig || {
    hero: heroConfig,
    stats: null,
    steps: stepsConfig,
    features: featuresConfig,
    faq: faqConfig,
    marquee: marqueeConfig,
    modelShowcase: modelShowcaseConfig,
    apiTypes: apiTypesConfig,
    hiddenSections: new Set(),
    footer: null,
  };
  const hidden = cfg.hiddenSections;

  useEffect(() => {
    const checkNoticeAndShow = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate !== today) {
        try {
          const res = await API.get('/api/notice');
          const { success, data } = res.data;
          if (success && data && data.trim() !== '') {
            setNoticeVisible(true);
          }
        } catch (error) {
          console.error('获取公告失败:', error);
        }
      }
    };
    checkNoticeAndShow();
  }, []);

  return (
    <div className='w-full overflow-x-hidden'>
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />
      <HeroSection config={cfg.hero} stats={cfg.stats} t={t} />
      {!hidden.has('marquee') && (
        <ScrollReveal delay={0}>
          <LogoMarquee config={cfg.marquee} t={t} />
        </ScrollReveal>
      )}
      {!hidden.has('modelShowcase') && (
        <ScrollReveal delay={50}>
          <ModelShowcaseSection config={cfg.modelShowcase} t={t} />
        </ScrollReveal>
      )}
      {!hidden.has('apiTypes') && (
        <ScrollReveal delay={50}>
          <APITypesSection config={cfg.apiTypes} t={t} />
        </ScrollReveal>
      )}
      {!hidden.has('steps') && (
        <ScrollReveal delay={50}>
          <StepsSection config={cfg.steps} statusState={statusState} t={t} />
        </ScrollReveal>
      )}
      {!hidden.has('features') && (
        <ScrollReveal delay={50}>
          <FeaturesSection config={cfg.features} t={t} />
        </ScrollReveal>
      )}
      {!hidden.has('faq') && (
        <ScrollReveal delay={50}>
          <FAQSection config={cfg.faq} t={t} />
        </ScrollReveal>
      )}
      {cfg.footer && <HomeFooter config={cfg.footer} />}
    </div>
  );
};

export default Home;
