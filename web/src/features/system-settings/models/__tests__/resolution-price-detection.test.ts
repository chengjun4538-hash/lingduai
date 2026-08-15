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

import { getResolutionPricedModelNames } from '../model-pricing-snapshots'

describe('分辨率价格识别', () => {
  test('图片与 Vidu 分档键会被识别为基础模型已配置价格', () => {
    const modelNames = getResolutionPricedModelNames(`{
      "Nano Banana 2:1k": 0.02,
      "Nano Banana 2:2K": 0.03,
      "Nano Banana 2:4k": 0.04,
      "viduq3:720p": 0.6
    }`)

    assert.deepEqual([...modelNames].sort(), ['Nano Banana 2', 'viduq3'])
  })

  test('普通含冒号模型名不会被误判为分辨率价格', () => {
    const modelNames = getResolutionPricedModelNames(`{
      "vendor:model": 0.02,
      "image-model:8k": 0.08
    }`)

    assert.equal(modelNames.size, 0)
  })
})
