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

export type Theme = 'dark' | 'light' | 'system'

const THEMES = new Set<Theme>(['dark', 'light', 'system'])

export function resolveThemePreference(
  storedTheme: string | undefined,
  legacyTheme: string | null | undefined,
  fallback: Theme
): Theme {
  if (storedTheme && THEMES.has(storedTheme as Theme)) {
    return storedTheme as Theme
  }

  // 旧版只持久化明暗两种有效视觉状态；优先继承它，避免升级后突然跟随系统变色。
  if (legacyTheme === 'dark' || legacyTheme === 'light') {
    return legacyTheme
  }

  return fallback
}
