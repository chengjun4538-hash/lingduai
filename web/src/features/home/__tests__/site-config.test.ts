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
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { defaultSiteConfig, parseSiteConfig } from '../site-config'

describe('parseSiteConfig', () => {
  test('空内容使用内置首页配置', () => {
    assert.equal(parseSiteConfig(''), defaultSiteConfig)
  })

  test('数据库配置递归覆盖首页字段并保留其他默认值', () => {
    const config = parseSiteConfig(
      JSON.stringify({
        home: {
          hero: { titleLine1: '自定义标题' },
          hiddenSections: ['faq'],
        },
      })
    )

    assert.ok(config)
    assert.equal(config.home.hero.titleLine1, '自定义标题')
    assert.equal(config.home.hero.titleLine2, '大模型接口网关')
    assert.deepEqual(config.home.hiddenSections, ['faq'])
  })

  test('仅配置旧版导航时仍按站点配置解析', () => {
    const config = parseSiteConfig(
      JSON.stringify({
        nav: {
          docs: { label: '接口文档', url: 'https://example.com/docs' },
        },
      })
    )

    assert.ok(config)
    assert.equal(config.nav.docs?.label, '接口文档')
    assert.equal(config.nav.docs?.url, 'https://example.com/docs')
    assert.equal(config.home.hero.titleLine1, '统一的')
  })

  test('普通 HTML 和非首页 JSON 仍交给官方自定义正文逻辑', () => {
    assert.equal(parseSiteConfig('<h1>Custom</h1>'), null)
    assert.equal(parseSiteConfig('{"title":"Custom"}'), null)
  })
})
