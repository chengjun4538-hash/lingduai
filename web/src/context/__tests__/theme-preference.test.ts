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

import { resolveThemePreference } from '../theme-preference'

describe('resolveThemePreference', () => {
  test('新版 Cookie 已设置时尊重用户当前选择', () => {
    assert.equal(resolveThemePreference('system', 'dark', 'dark'), 'system')
  })

  test('新版 Cookie 缺失时继承旧版黑色主题', () => {
    assert.equal(resolveThemePreference(undefined, 'dark', 'light'), 'dark')
  })

  test('没有可用历史设置时使用指定默认主题', () => {
    assert.equal(resolveThemePreference(undefined, 'auto', 'dark'), 'dark')
  })
})
