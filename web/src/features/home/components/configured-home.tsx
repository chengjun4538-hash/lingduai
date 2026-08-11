/*
Copyright (C) 2023-2026 QuantumNous

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
import { ArrowRight, BookOpen, Check, ExternalLink } from 'lucide-react'
import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useStatus } from '@/hooks/use-status'
import { getLobeIcon } from '@/lib/lobe-icon'

import { resolveHomeModelIconName } from '../lib/model-icon'
import type {
  HomeButtonConfig,
  HomeFooterConfig,
  HomeListItem,
  HomeModelConfig,
  SiteConfig,
} from '../site-config'

const PROVIDERS = [
  'OpenAI',
  'Claude',
  'Gemini',
  'DeepSeek',
  'Qwen',
  'Grok',
  'Moonshot',
  'Azure AI',
  'Suno',
  'Midjourney',
]

const MODEL_CARD_PALETTE = [
  {
    gradient:
      'linear-gradient(135deg, rgba(16, 163, 127, 0.18) 0%, rgba(0, 0, 0, 0) 100%)',
    border: 'rgba(52, 211, 153, 0.22)',
    tags: ['#34d399', '#818cf8', '#f59e0b'],
  },
  {
    gradient:
      'linear-gradient(135deg, rgba(204, 93, 74, 0.18) 0%, rgba(0, 0, 0, 0) 100%)',
    border: 'rgba(244, 114, 182, 0.22)',
    tags: ['#f472b6', '#a78bfa', '#22d3ee'],
  },
  {
    gradient:
      'linear-gradient(135deg, rgba(96, 165, 250, 0.18) 0%, rgba(0, 0, 0, 0) 100%)',
    border: 'rgba(96, 165, 250, 0.22)',
    tags: ['#60a5fa', '#34d399', '#fbbf24'],
  },
  {
    gradient:
      'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(0, 0, 0, 0) 100%)',
    border: 'rgba(129, 140, 248, 0.22)',
    tags: ['#818cf8', '#f59e0b', '#34d399'],
  },
  {
    gradient:
      'linear-gradient(135deg, rgba(226, 232, 240, 0.1) 0%, rgba(0, 0, 0, 0) 100%)',
    border: 'rgba(226, 232, 240, 0.16)',
    tags: ['#e2e8f0', '#f472b6', '#22d3ee'],
  },
  {
    gradient:
      'linear-gradient(135deg, rgba(251, 191, 36, 0.16) 0%, rgba(0, 0, 0, 0) 100%)',
    border: 'rgba(251, 191, 36, 0.22)',
    tags: ['#fbbf24', '#34d399', '#f472b6'],
  },
]

function SectionHeading(props: { title: string; subtitle?: string }) {
  return (
    <div className='mx-auto mb-12 max-w-2xl text-center'>
      <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>
        {props.title}
      </h2>
      {props.subtitle && (
        <p className='text-muted-foreground mt-3 text-sm leading-relaxed md:text-base'>
          {props.subtitle}
        </p>
      )}
    </div>
  )
}

function resolveButtonUrl(button: HomeButtonConfig, docsUrl: string) {
  return button.useDocsLink ? docsUrl : button.url || '#'
}

function ActionLink(props: {
  button: HomeButtonConfig
  docsUrl: string
  primary?: boolean
}) {
  const href = resolveButtonUrl(props.button, props.docsUrl)
  const external = /^https?:\/\//.test(href)
  const Icon = props.button.useDocsLink ? BookOpen : ArrowRight

  return (
    <Button
      variant={props.primary ? 'default' : 'outline'}
      className='h-11 rounded-full px-6'
      render={
        <a
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
        />
      }
    >
      <Icon className='size-4' />
      {props.button.text}
    </Button>
  )
}

function ConfiguredHero(props: {
  config: SiteConfig['home']['hero']
  docsUrl: string
}) {
  return (
    <section className='configured-hero'>
      <div className='configured-hero-decoration' aria-hidden='true'>
        <span className='configured-hero-glow configured-hero-glow-blue' />
        <span className='configured-hero-glow configured-hero-glow-violet' />
        <span className='configured-hero-glow configured-hero-glow-pink' />
      </div>
      <div className='configured-hero-content'>
        <div className='configured-hero-badge'>
          <span className='configured-hero-badge-dot' />
          {props.config.badge}
        </div>
        <h1 className='configured-hero-title'>
          {props.config.titleLine1}
          <span className='configured-hero-title-gradient'>
            {props.config.titleLine2}
          </span>
        </h1>
        <p className='configured-hero-subtitle'>
          {props.config.subtitle}
        </p>
        <div className='configured-hero-actions'>
          <ActionLink
            button={props.config.primaryButton}
            docsUrl={props.docsUrl}
            primary
          />
          <ActionLink
            button={props.config.secondaryButton}
            docsUrl={props.docsUrl}
          />
        </div>
        <div className='configured-hero-stats'>
          {props.config.stats.map((stat, index) => (
            <Fragment key={`${stat.value}-${stat.label}`}>
              <div className='configured-hero-stat'>
                <span
                  className='configured-hero-stat-value'
                  style={stat.color ? { color: stat.color } : undefined}
                >
                  {stat.value}
                </span>
                <span className='configured-hero-stat-label'>
                  {stat.label}
                </span>
              </div>
              {index < props.config.stats.length - 1 && (
                <span className='configured-hero-stat-separator' />
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProviderMarquee(props: { title: string }) {
  return (
    <section className='border-border/40 border-y px-6 py-14'>
      <p className='text-muted-foreground mb-8 text-center text-xs font-semibold tracking-widest uppercase'>
        {props.title}
      </p>
      <div className='mx-auto flex max-w-5xl flex-wrap justify-center gap-3'>
        {PROVIDERS.map((provider) => (
          <span
            key={provider}
            className='border-border/50 bg-muted/20 rounded-full border px-4 py-2 text-sm font-medium'
          >
            {provider}
          </span>
        ))}
      </div>
    </section>
  )
}

function ModelShowcase(props: {
  title: string
  subtitle: string
  models: HomeModelConfig[]
}) {
  const { t } = useTranslation()

  return (
    <section className='configured-model-showcase px-6 py-20 md:py-28'>
      <div className='mx-auto max-w-6xl'>
        <SectionHeading title={props.title} subtitle={props.subtitle} />
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {props.models.map((model, modelIndex) => {
            const icon = getLobeIcon(resolveHomeModelIconName(model), 22)
            const palette =
              MODEL_CARD_PALETTE[modelIndex % MODEL_CARD_PALETTE.length]
            return (
              <article
                key={model.name}
                className='configured-model-card'
                style={{
                  background: palette.gradient,
                  borderColor: palette.border,
                }}
              >
                <div className='configured-model-card-header'>
                  <div className='configured-model-card-icon'>{icon}</div>
                  <span className='configured-model-card-provider'>
                    {model.provider}
                  </span>
                </div>
                <h3 className='configured-model-card-name'>{model.name}</h3>
                <div className='configured-model-card-tags'>
                  {model.tags?.map((tag, tagIndex) => {
                    const color = palette.tags[tagIndex % palette.tags.length]
                    return (
                      <span
                        key={tag}
                        className='configured-model-card-tag'
                        style={{
                          color,
                          borderColor: `${color}40`,
                          background: `${color}10`,
                        }}
                      >
                        {tag}
                      </span>
                    )
                  })}
                </div>
                <p className='configured-model-card-description'>
                  {model.desc || model.description}
                </p>
                <a href='/console' className='configured-model-card-action'>
                  {t('Get Started')} →
                </a>
              </article>
            )
          })}
        </div>
        <div className='mt-8 text-center'>
          <Button variant='outline' render={<a href='/pricing' />}>
            {t('View all currently available models')}
            <ArrowRight className='size-4' />
          </Button>
        </div>
      </div>
    </section>
  )
}

function ApiTypes(props: { config: SiteConfig['home']['apiTypes'] }) {
  const [activeKey, setActiveKey] = useState(
    props.config.tabs[0]?.key || 'chat'
  )
  const active =
    props.config.tabs.find((item) => item.key === activeKey) ||
    props.config.tabs[0]

  if (!active) return null

  return (
    <section className='border-border/40 bg-muted/10 border-y px-6 py-20 md:py-28'>
      <div className='mx-auto max-w-6xl'>
        <SectionHeading
          title={props.config.title}
          subtitle={props.config.subtitle}
        />
        <div className='mb-8 flex flex-wrap justify-center gap-2'>
          {props.config.tabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeKey === tab.key ? 'default' : 'outline'}
              onClick={() => setActiveKey(tab.key)}
            >
              {tab.label || tab.key}
            </Button>
          ))}
        </div>
        <div className='border-border/50 bg-background grid overflow-hidden rounded-xl border md:grid-cols-2'>
          <div className='p-7 md:p-10'>
            <h3 className='text-xl font-bold'>{active.title}</h3>
            <p className='text-muted-foreground mt-4 text-sm leading-relaxed'>
              {active.desc}
            </p>
            <ul className='mt-6 grid gap-3 sm:grid-cols-2'>
              {active.features?.map((feature) => (
                <li key={feature} className='flex items-center gap-2 text-sm'>
                  <Check className='size-4 text-emerald-500' />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className='bg-slate-950 p-7 font-mono text-xs text-slate-300 md:p-10'>
            <div className='mb-6 flex gap-1.5'>
              <span className='size-2.5 rounded-full bg-red-400' />
              <span className='size-2.5 rounded-full bg-amber-400' />
              <span className='size-2.5 rounded-full bg-emerald-400' />
            </div>
            <p className='text-slate-500'># {active.label || active.key}</p>
            <p className='mt-3'>client = OpenAI(</p>
            <p className='pl-4 text-emerald-300'>api_key=&quot;sk-...&quot;,</p>
            <p className='pl-4 text-sky-300'>
              base_url=&quot;https://.../v1&quot;
            </p>
            <p>)</p>
            <p className='mt-5 text-violet-300'># 使用统一端点发起请求</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function NumberedSection(props: {
  title: string
  subtitle?: string
  items: HomeListItem[]
  columns?: 3 | 6
  actions?: {
    primary: HomeButtonConfig
    secondary: HomeButtonConfig
    docsUrl: string
  }
}) {
  return (
    <section className='px-6 py-20 md:py-28'>
      <div className='mx-auto max-w-6xl'>
        <SectionHeading title={props.title} subtitle={props.subtitle} />
        <div
          className={
            props.columns === 6
              ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
              : 'grid gap-6 md:grid-cols-3'
          }
        >
          {props.items.map((item, index) => (
            <article
              key={`${item.num || index}-${item.title}`}
              className='border-border/50 bg-muted/10 rounded-xl border p-6'
            >
              <span className='text-sm font-bold text-blue-500'>
                {item.num || String(index + 1).padStart(2, '0')}
              </span>
              <h3 className='mt-4 font-semibold'>{item.title}</h3>
              <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                {item.desc}
              </p>
            </article>
          ))}
        </div>
        {props.actions && (
          <div className='mt-10 flex flex-wrap justify-center gap-3'>
            <ActionLink
              button={props.actions.primary}
              docsUrl={props.actions.docsUrl}
              primary
            />
            <ActionLink
              button={props.actions.secondary}
              docsUrl={props.actions.docsUrl}
            />
          </div>
        )}
      </div>
    </section>
  )
}

function FaqSection(props: { config: SiteConfig['home']['faq'] }) {
  return (
    <section className='border-border/40 bg-muted/10 border-t px-6 py-20 md:py-28'>
      <div className='mx-auto max-w-3xl'>
        <SectionHeading
          title={props.config.title}
          subtitle={props.config.subtitle}
        />
        <div className='space-y-3'>
          {props.config.items.map((item, index) => (
            <details
              key={item.q}
              className='border-border/50 bg-background group rounded-xl border px-5 py-4'
            >
              <summary className='flex cursor-pointer list-none items-center gap-4 font-medium'>
                <span className='font-mono text-xs text-blue-500'>
                  {String(index + 1).padStart(2, '0')}
                </span>
                {item.q}
              </summary>
              <p className='text-muted-foreground pt-4 pl-9 text-sm leading-relaxed'>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function ConfiguredFooter(props: { config: HomeFooterConfig }) {
  return (
    <footer className='border-border/50 border-t px-6 py-12'>
      <div className='mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:justify-between'>
        <div>
          {props.config.copyright && (
            <p className='text-muted-foreground text-sm'>
              {props.config.copyright}
            </p>
          )}
          <div className='mt-4 flex flex-wrap gap-3'>
            {props.config.socials?.map((item) => {
              const href = item.url || item.qrcode
              if (!href) return null
              return (
                <a
                  key={`${item.type}-${href}`}
                  href={href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs'
                >
                  {item.label || item.type}
                  <ExternalLink className='size-3' />
                </a>
              )
            })}
          </div>
        </div>
        <div className='flex flex-wrap gap-12'>
          {props.config.columns?.map((column) => (
            <div key={column.title}>
              <h3 className='mb-3 text-xs font-semibold tracking-wider uppercase'>
                {column.title}
              </h3>
              <ul className='space-y-2'>
                {column.links.map((link) => (
                  <li key={`${link.label}-${link.url}`}>
                    <a
                      href={link.url}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      className='text-muted-foreground hover:text-foreground text-sm'
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {props.config.newApiLink !== false && (
        <p className='text-muted-foreground/60 mx-auto mt-10 max-w-6xl text-xs'>
          Powered by{' '}
          <a
            href='https://github.com/QuantumNous/new-api'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-foreground'
          >
            New API
          </a>
        </p>
      )}
    </footer>
  )
}

export function ConfiguredHome(props: { config: SiteConfig }) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const docsUrl =
    (status?.docs_link as string | undefined) || 'https://docs.newapi.pro'
  const home = props.config.home
  const hidden = new Set(home.hiddenSections)

  // 配置文本沿用旧版 i18n key 语义；没有对应翻译时 i18next 会直接显示原文。
  const translate = (value: string) => t(value)
  const translateItems = (items: HomeListItem[]) =>
    items.map((item) => ({
      ...item,
      title: translate(item.title),
      desc: translate(item.desc),
    }))

  return (
    <div className='configured-home'>
      <ConfiguredHero
        config={{
          ...home.hero,
          badge: translate(home.hero.badge),
          titleLine1: translate(home.hero.titleLine1),
          titleLine2: translate(home.hero.titleLine2),
          subtitle: translate(home.hero.subtitle),
          primaryButton: {
            ...home.hero.primaryButton,
            text: translate(home.hero.primaryButton.text),
          },
          secondaryButton: {
            ...home.hero.secondaryButton,
            text: translate(home.hero.secondaryButton.text),
          },
          stats: home.hero.stats.map((stat) => ({
            ...stat,
            label: translate(stat.label),
          })),
        }}
        docsUrl={docsUrl}
      />
      {!hidden.has('marquee') && (
        <ProviderMarquee title={translate(home.marquee.title)} />
      )}
      {!hidden.has('modelShowcase') && (
        <ModelShowcase
          title={translate(home.modelShowcase.title)}
          subtitle={translate(home.modelShowcase.subtitle)}
          models={home.modelShowcase.models.map((model) => ({
            ...model,
            provider: model.provider ? translate(model.provider) : undefined,
            tags: model.tags?.map(translate),
            desc: model.desc ? translate(model.desc) : undefined,
            description: model.description
              ? translate(model.description)
              : undefined,
          }))}
        />
      )}
      {!hidden.has('apiTypes') && (
        <ApiTypes
          config={{
            ...home.apiTypes,
            title: translate(home.apiTypes.title),
            subtitle: translate(home.apiTypes.subtitle),
            tabs: home.apiTypes.tabs.map((tab) => ({
              ...tab,
              label: tab.label ? translate(tab.label) : undefined,
              title: tab.title ? translate(tab.title) : undefined,
              desc: tab.desc ? translate(tab.desc) : undefined,
              features: tab.features?.map(translate),
            })),
          }}
        />
      )}
      {!hidden.has('steps') && (
        <NumberedSection
          title={translate(home.steps.title)}
          subtitle={translate(home.steps.subtitle || '')}
          items={translateItems(home.steps.items)}
          actions={{
            primary: {
              ...home.steps.primaryButton,
              text: translate(home.steps.primaryButton.text),
            },
            secondary: {
              ...home.steps.secondaryButton,
              text: translate(home.steps.secondaryButton.text),
            },
            docsUrl,
          }}
        />
      )}
      {!hidden.has('features') && (
        <NumberedSection
          title={translate(home.features.title)}
          subtitle={translate(home.features.subtitle || '')}
          items={translateItems(home.features.items)}
          columns={6}
        />
      )}
      {!hidden.has('faq') && (
        <FaqSection
          config={{
            ...home.faq,
            title: translate(home.faq.title),
            subtitle: translate(home.faq.subtitle || ''),
            items: home.faq.items.map((item) => ({
              q: translate(item.q),
              a: translate(item.a),
            })),
          }}
        />
      )}
      <ConfiguredFooter
        config={{
          ...props.config.footer,
          copyright: props.config.footer.copyright
            ? translate(props.config.footer.copyright)
            : undefined,
          socials: props.config.footer.socials?.map((item) => ({
            ...item,
            label: item.label ? translate(item.label) : undefined,
          })),
          columns: props.config.footer.columns?.map((column) => ({
            ...column,
            title: translate(column.title),
            links: column.links.map((link) => ({
              ...link,
              label: translate(link.label),
            })),
          })),
        }}
      />
    </div>
  )
}
