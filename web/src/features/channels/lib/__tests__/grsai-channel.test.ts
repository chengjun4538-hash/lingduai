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
import { test } from 'node:test'

import { CHANNEL_TYPE_OPTIONS, MODEL_FETCHABLE_TYPES } from '../../constants'
import { CHANNEL_FORM_DEFAULT_VALUES, channelFormSchema } from '../channel-form'
import { getChannelTypeConfig } from '../channel-type-config'

test('Grsai 可从渠道列表选择并使用默认节点创建渠道', () => {
  assert.deepEqual(
    CHANNEL_TYPE_OPTIONS.find((option) => option.value === 61),
    { value: 61, label: 'Grsai' }
  )
  assert.equal(getChannelTypeConfig(61).defaultBaseUrl, 'https://grsaiapi.com')
  assert.equal(
    channelFormSchema.safeParse({
      ...CHANNEL_FORM_DEFAULT_VALUES,
      name: 'Grsai',
      type: 61,
      base_url: '',
      key: 'test-key',
      models: 'nano-banana-2',
    }).success,
    true
  )
  assert.equal(MODEL_FETCHABLE_TYPES.has(61), false)
})
