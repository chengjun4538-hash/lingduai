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

import type { PricingModel } from '../../types'
import { buildSupportedParameters } from '../mock-stats'
import { getResolutionPricing } from '../price'
import { buildVideoSample } from '../video-api-samples'

const model: PricingModel = {
  id: 1,
  model_name: 'video-alias',
  quota_type: 1,
  model_ratio: 0,
  completion_ratio: 0,
  enable_groups: ['default'],
  supported_endpoint_types: ['openai-video'],
  grsai_video_resolution_prices: [
    { resolution: '480p', model_price: 0.1 },
    { resolution: '768p', model_price: 0.2 },
    { resolution: '1080p', model_price: 0.3 },
  ],
}

describe('Grsai 视频模型展示', () => {
  test('模型别名使用按秒价格和 H3 参数，不展示聊天参数', () => {
    assert.deepEqual(getResolutionPricing(model), {
      unit: 'second',
      prices: model.grsai_video_resolution_prices,
    })
    const parameters = buildSupportedParameters(model)
    assert.deepEqual(
      parameters.find((p) => p.name === 'resolution')?.enumValues,
      ['480p', '768p', '1080p']
    )
    assert.equal(
      parameters.find((p) => p.name === 'duration')?.range,
      '1–15 (1080p: 1–10)'
    )
    assert.ok(parameters.some((p) => p.name === 'audios'))
    assert.ok(
      !parameters.some((p) => ['messages', 'stream', 'fps'].includes(p.name))
    )
  })

  test('各语言示例提交视频并使用返回的任务 ID 查询', () => {
    for (const lang of [
      'curl',
      'python',
      'typescript',
      'javascript',
    ] as const) {
      const sample = buildVideoSample(lang, {
        baseUrl: 'https://gateway.example',
        apiKeyEnv: 'NEW_API_KEY',
        modelName: 'video-alias',
        endpointPath: '/v1/videos',
      })
      assert.ok(sample.includes('https://gateway.example/v1/videos'))
      assert.ok(sample.includes('video-alias'))
      assert.ok(sample.includes('NEW_API_KEY'))
      assert.ok(sample.includes('completed') || sample.includes('in_progress'))
      assert.ok(sample.includes('failed'))
      assert.ok(!sample.includes('/chat/completions'))
      assert.ok(!sample.includes('messages'))
    }
  })
})
