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

import { resolveHomeModelIconName } from '../lib/model-icon'

describe('resolveHomeModelIconName', () => {
  test('旧版小写供应商键映射为真实品牌图标', () => {
    assert.equal(
      resolveHomeModelIconName({ name: 'GPT', providerKey: 'openai' }),
      'OpenAI'
    )
    assert.equal(
      resolveHomeModelIconName({ name: 'Claude', providerKey: 'claude' }),
      'Claude.Color'
    )
    assert.equal(
      resolveHomeModelIconName({ name: 'Gemini', providerKey: 'gemini' }),
      'Gemini.Color'
    )
  })

  test('显式图标配置优先于供应商映射', () => {
    assert.equal(
      resolveHomeModelIconName({
        name: 'Nano banana pro',
        providerKey: 'google',
        icon: 'Sparkles',
      }),
      'Sparkles'
    )
  })
})
