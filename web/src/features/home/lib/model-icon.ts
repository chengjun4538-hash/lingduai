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
import type { HomeModelConfig } from '../site-config'

const HOME_MODEL_ICON_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  claude: 'Claude.Color',
  anthropic: 'Claude.Color',
  gemini: 'Gemini.Color',
  google: 'Gemini.Color',
  deepseek: 'DeepSeek.Color',
  grok: 'Grok',
  xai: 'Grok',
  qwen: 'Qwen.Color',
  aliyun: 'Qwen.Color',
  alibaba: 'Qwen.Color',
  moonshot: 'Moonshot',
  kimi: 'Moonshot',
  volcengine: 'Volcengine.Color',
  bytedance: 'Volcengine.Color',
}

export function resolveHomeModelIconName(model: HomeModelConfig): string {
  if (model.icon) return model.icon

  const configuredName = model.providerKey || model.provider || ''
  const normalizedName = configuredName
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')

  return HOME_MODEL_ICON_NAMES[normalizedName] || configuredName
}
