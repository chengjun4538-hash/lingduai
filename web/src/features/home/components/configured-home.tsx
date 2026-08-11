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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useStatus } from '@/hooks/use-status'
import { getLobeIcon } from '@/lib/lobe-icon'

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
      className='h-11 rounded-lg px-5'
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
    <section className='relative overflow-hidden px-6 pt-28 pb-20 md:pt-36 md:pb-24'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10 opacity-30 dark:opacity-20'
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 20% 20%, oklch(0.65 0.2 255 / 70%), transparent 70%), radial-gradient(ellipse 50% 45% at 80% 25%, oklch(0.63 0.2 300 / 55%), transparent 70%)',
        }}
      />
      <div className='mx-auto flex max-w-5xl flex-col items-center text-center'>
        <div className='mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400'>
          <span className='size-1.5 rounded-full bg-blue-500' />
          {props.config.badge}
        </div>
        <h1 className='text-[clamp(2.5rem,7vw,5rem)] leading-[1.08] font-bold tracking-tight'>
          {props.config.titleLine1}
          <span className='block bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-500 bg-clip-text text-transparent'>
            {props.config.titleLine2}
          </span>
        </h1>
        <p className='text-muted-foreground mt-6 max-w-2xl text-base leading-relaxed md:text-lg'>
          {props.config.subtitle}
        </p>
        <div className='mt-8 flex flex-wrap justify-center gap-3'>
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
        <div className='border-border/50 bg-background/60 mt-14 grid w-full max-w-4xl grid-cols-2 overflow-hidden rounded-xl border shadow-sm backdrop-blur-sm md:grid-cols-4'>
          {props.config.stats.map((stat) => (
            <div
              key={`${stat.value}-${stat.label}`}
              className='border-border/40 flex flex-col items-center border-r border-b px-4 py-5 last:border-r-0 md:border-b-0'
            >
              <span
                className='text-2xl font-bold tabular-nums md:text-3xl'
                style={stat.color ? { color: stat.color } : undefined}
              >
                {stat.value}
              </span>
              <span className='text-muted-foreground mt-1 text-xs'>
                {stat.label}
              </span>
            </div>
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
  return (
    <section className='px-6 py-20 md:py-28'>
      <div className='mx-auto max-w-6xl'>
        <SectionHeading title={props.title} subtitle={props.subtitle} />
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {props.models.map((model) => {
            const iconKey = model.icon || model.providerKey || model.provider
            const icon = iconKey ? getLobeIcon(iconKey, 24) : null
            return (
              <article
                key={model.name}
                className='border-border/50 bg-muted/10 hover:bg-muted/20 rounded-xl border p-5 transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <div className='bg-background flex size-10 items-center justify-center rounded-lg border'>
                    {icon || model.name.slice(0, 1)}
                  </div>
                  <div>
                    <h3 className='font-mono text-sm font-semibold'>
                      {model.name}
                    </h3>
                    <p className='text-muted-foreground text-xs'>
                      {model.provider}
                    </p>
                  </div>
                </div>
                <div className='mt-4 flex flex-wrap gap-1.5'>
                  {model.tags?.map((tag) => (
                    <span
                      key={tag}
                      className='rounded-md bg-blue-500/8 px-2 py-1 text-[11px] text-blue-600 dark:text-blue-400'
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className='text-muted-foreground mt-4 text-sm leading-relaxed'>
                  {model.desc || model.description}
                </p>
              </article>
            )
          })}
        </div>
        <div className='mt-8 text-center'>
          <Button variant='outline' render={<a href='/pricing' />}>
            查看全部模型
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
    <>
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
    </>
  )
}
