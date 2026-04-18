/**
 * useHomeConfig.js
 *
 * 合并 homeConfig.js（编译期默认值）与 site-config.json 中的 home 覆盖配置。
 * site-config.json 的 home 字段优先级更高，且无需重新构建即可生效。
 *
 * site-config.json home 字段示例（所有字段均为可选，未填则使用 homeConfig.js 默认值）：
 * {
 *   "home": {
 *     "hero": {
 *       "badge": "统一 AI 接入平台",
 *       "titleLine1": "统一的",
 *       "titleLine2": "大模型接口网关",
 *       "subtitle": "描述文案",
 *       "primaryButton": { "text": "获取密钥", "url": "/console" },
 *       "secondaryButton": { "text": "查看文档", "useDocsLink": true, "url": "https://..." },
 *       "stats": [
 *         { "value": "40+", "label": "支持供应商", "color": "#ffffff" }
 *       ]
 *     },
 *     "steps": {
 *       "title": "3 步快速接入",
 *       "subtitle": "副标题",
 *       "items": [ { "num": "01", "title": "创建 API Key", "desc": "描述..." } ]
 *     },
 *     "features": {
 *       "title": "为什么选择我们",
 *       "subtitle": "副标题",
 *       "items": [ { "num": "01", "title": "功能名", "desc": "描述..." } ]
 *     },
 *     "faq": {
 *       "title": "常见问题",
 *       "subtitle": "副标题",
 *       "items": [ { "q": "问题？", "a": "回答。" } ]
 *     },
 *     "hiddenSections": ["marquee", "modelShowcase", "apiTypes", "steps", "features", "faq"]
 *   }
 * }
 */
import { useMemo } from 'react';
import { useSiteConfig } from './useSiteConfig';
import {
  heroConfig as defaultHero,
  statsConfig as defaultStats,
  stepsConfig as defaultSteps,
  featuresConfig as defaultFeatures,
  faqConfig as defaultFaq,
  modelShowcaseConfig as defaultModelShowcase,
  apiTypesConfig as defaultApiTypes,
  marqueeConfig as defaultMarquee,
} from '../../pages/Home/homeConfig';

// 将 site-config.json home.hero 转换成 HeroSection 期望的 config 格式
function buildHeroConfig(siteHero) {
  if (!siteHero) return defaultHero;
  return {
    badgeKey: siteHero.badge ?? defaultHero.badgeKey,
    titleLine1Key: siteHero.titleLine1 ?? defaultHero.titleLine1Key,
    titleLine2Key: siteHero.titleLine2 ?? defaultHero.titleLine2Key,
    subtitleKey: siteHero.subtitle ?? defaultHero.subtitleKey,
    ctaPrimary: siteHero.primaryButton
      ? { textKey: siteHero.primaryButton.text, path: siteHero.primaryButton.url ?? '/console' }
      : defaultHero.ctaPrimary,
    ctaSecondary: siteHero.secondaryButton
      ? {
          textKey: siteHero.secondaryButton.text,
          useDocsLink: siteHero.secondaryButton.useDocsLink ?? defaultHero.ctaSecondary.useDocsLink,
          url: siteHero.secondaryButton.url,
        }
      : defaultHero.ctaSecondary,
  };
}

// 将 site-config.json home.steps 转换成 StepsSection 期望的 config 格式
function buildStepsConfig(siteSteps) {
  if (!siteSteps) return defaultSteps;
  const base = { ...defaultSteps };
  if (siteSteps.title) base.sectionTitleKey = siteSteps.title;
  if (siteSteps.subtitle) base.sectionSubtitleKey = siteSteps.subtitle;
  if (siteSteps.items?.length) {
    base.steps = siteSteps.items.map((item) => ({
      num: item.num,
      titleKey: item.title,
      descKey: item.desc,
    }));
  }
  if (siteSteps.primaryButton) {
    base.ctaPrimary = { textKey: siteSteps.primaryButton.text, path: siteSteps.primaryButton.url ?? '/console' };
  }
  if (siteSteps.secondaryButton) {
    base.ctaSecondary = { textKey: siteSteps.secondaryButton.text, useDocsLink: siteSteps.secondaryButton.useDocsLink ?? true };
  }
  return base;
}

// 将 site-config.json home.features 转换成 FeaturesSection 期望的 config 格式
function buildFeaturesConfig(siteFeatures) {
  if (!siteFeatures) return defaultFeatures;
  const base = { ...defaultFeatures };
  if (siteFeatures.title) base.sectionTitleKey = siteFeatures.title;
  if (siteFeatures.subtitle) base.sectionSubtitleKey = siteFeatures.subtitle;
  if (siteFeatures.items?.length) {
    base.features = siteFeatures.items.map((item) => ({
      num: item.num,
      titleKey: item.title,
      descKey: item.desc,
    }));
  }
  return base;
}

// 将 site-config.json home.faq 转换成 FAQSection 期望的 config 格式
function buildFaqConfig(siteFaq) {
  if (!siteFaq) return defaultFaq;
  const base = { ...defaultFaq };
  if (siteFaq.title) base.sectionTitleKey = siteFaq.title;
  if (siteFaq.subtitle) base.sectionSubtitleKey = siteFaq.subtitle;
  if (siteFaq.items?.length) {
    base.faqs = siteFaq.items.map((item) => ({
      qKey: item.q,
      aKey: item.a,
    }));
  }
  return base;
}

/**
 * 返回合并后的首页配置。
 * siteConfig 为 null 时表示正在加载，返回 null 等待。
 */
export const useHomeConfig = () => {
  const siteConfig = useSiteConfig();

  return useMemo(() => {
    if (siteConfig === null) return null; // 加载中

    const home = siteConfig?.home || {};

    const hero = buildHeroConfig(home.hero);
    const stats = home.hero?.stats ?? defaultStats;
    const steps = buildStepsConfig(home.steps);
    const features = buildFeaturesConfig(home.features);
    const faq = buildFaqConfig(home.faq);

    // 区块显示/隐藏控制
    const hiddenSections = new Set(home.hiddenSections ?? []);

    // 标题/副标题区块覆盖
    const marquee = home.marquee
      ? { sectionTitleKey: home.marquee.title ?? defaultMarquee.sectionTitleKey }
      : defaultMarquee;

    const modelShowcase = home.modelShowcase
      ? {
          sectionTitleKey: home.modelShowcase.title ?? defaultModelShowcase.sectionTitleKey,
          sectionSubtitleKey: home.modelShowcase.subtitle ?? defaultModelShowcase.sectionSubtitleKey,
          // cards 数组：可选，每项 { name, provider, providerKey?, icon?, tags?, desc? }
          // 缺省时 ModelShowcaseSection 自动使用硬编码默认卡片
          cards: Array.isArray(home.modelShowcase.models) ? home.modelShowcase.models : undefined,
        }
      : defaultModelShowcase;

    const apiTypes = home.apiTypes
      ? {
          sectionTitleKey: home.apiTypes.title ?? defaultApiTypes.sectionTitleKey,
          sectionSubtitleKey: home.apiTypes.subtitle ?? defaultApiTypes.sectionSubtitleKey,
          // tabs 数组：每项 { key, label?, title?, desc?, features? } 可选覆盖各 tab 的文字内容
          tabs: home.apiTypes.tabs ?? defaultApiTypes.tabs,
        }
      : defaultApiTypes;

    // 页脚配置（来自 site-config.json 顶层的 footer 字段）
    const footer = siteConfig?.footer ?? null;

    return { hero, stats, steps, features, faq, marquee, modelShowcase, apiTypes, hiddenSections, footer };
  }, [siteConfig]);
};
