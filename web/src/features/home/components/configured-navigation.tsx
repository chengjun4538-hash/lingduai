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
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { TopNavLink } from '@/components/layout/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useStatus } from '@/hooks/use-status'

import type { HomeNavConfig, HomeNavGroup, HomeNavModel } from '../site-config'

const navLinkClass =
  'text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors'

function isExternalUrl(url: string) {
  return /^(?:https?:|mailto:)/.test(url)
}

function modelUrl(model: HomeNavModel) {
  return model.url || model.path || '/console'
}

function ModelNavMenu(props: { group: HomeNavGroup }) {
  const { t } = useTranslation()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={<button type='button' className={navLinkClass} />}
      >
        {t(props.group.label)}
        <ChevronDown className='size-3.5' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='center' className='w-[32rem] p-2'>
        <div className='grid grid-cols-2 gap-1'>
          {props.group.models.map((model) => {
            const href = modelUrl(model)
            const external = isExternalUrl(href)
            return (
              <a
                key={`${model.name}-${href}`}
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className='hover:bg-accent rounded-md p-2.5 transition-colors'
              >
                <span className='flex items-center gap-2 text-sm font-medium'>
                  {model.name}
                  {model.badge && (
                    <span className='bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[10px]'>
                      {t(model.badge)}
                    </span>
                  )}
                </span>
                {model.provider && (
                  <span className='text-muted-foreground mt-0.5 block text-[11px]'>
                    {model.provider}
                  </span>
                )}
                {model.description && (
                  <span className='text-muted-foreground mt-1 line-clamp-2 block text-xs leading-relaxed'>
                    {t(model.description)}
                  </span>
                )}
              </a>
            )
          })}
        </div>
        {props.group.viewAllPath && (
          <a
            href={props.group.viewAllPath}
            className='text-muted-foreground hover:text-foreground mt-1 block border-t px-2.5 pt-2 text-xs'
          >
            {t('Model Square')} →
          </a>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AboutNavMenu(props: { config: NonNullable<HomeNavConfig['about']> }) {
  const { t } = useTranslation()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={<button type='button' className={navLinkClass} />}
      >
        {t(props.config.label)}
        <ChevronDown className='size-3.5' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='center' className='w-44 p-1.5'>
        {props.config.items.map((item) => {
          const external = item.external || isExternalUrl(item.url)
          return (
            <a
              key={`${item.label}-${item.url}`}
              href={item.url}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className='hover:bg-accent block rounded-md px-2.5 py-2 text-sm transition-colors'
            >
              {t(item.label)}
            </a>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ConfiguredNavigation(props: { config: HomeNavConfig }) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const docsUrl =
    props.config.docs?.url ||
    (status?.docs_link as string | undefined) ||
    '/docs'

  return (
    <div className='flex items-center gap-0.5'>
      {props.config.console && (
        <a href={props.config.console.path} className={navLinkClass}>
          {t(props.config.console.label)}
        </a>
      )}
      {props.config.chat?.models.length ? (
        <ModelNavMenu group={props.config.chat} />
      ) : null}
      {props.config.image?.models.length ? (
        <ModelNavMenu group={props.config.image} />
      ) : null}
      {props.config.video?.models.length ? (
        <ModelNavMenu group={props.config.video} />
      ) : null}
      {props.config.docs && (
        <a
          href={docsUrl}
          target={isExternalUrl(docsUrl) ? '_blank' : undefined}
          rel={isExternalUrl(docsUrl) ? 'noopener noreferrer' : undefined}
          className={navLinkClass}
        >
          {t(props.config.docs.label)}
        </a>
      )}
      {props.config.about?.items.length ? (
        <AboutNavMenu config={props.config.about} />
      ) : null}
    </div>
  )
}

// 移动端沿用官方单层菜单，将旧版下拉项展开成可直接访问的入口。
export function buildConfiguredMobileLinks(
  config: HomeNavConfig,
  docsUrl?: string
): TopNavLink[] {
  const links: TopNavLink[] = []
  if (config.console) {
    links.push({ title: config.console.label, href: config.console.path })
  }
  for (const group of [config.chat, config.image, config.video]) {
    if (group?.viewAllPath) {
      links.push({ title: group.label, href: group.viewAllPath })
    }
  }
  if (config.docs) {
    const href = config.docs.url || docsUrl || '/docs'
    links.push({
      title: config.docs.label,
      href,
      external: isExternalUrl(href),
    })
  }
  for (const item of config.about?.items || []) {
    links.push({
      title: item.label,
      href: item.url,
      external: item.external || isExternalUrl(item.url),
    })
  }
  return links
}
