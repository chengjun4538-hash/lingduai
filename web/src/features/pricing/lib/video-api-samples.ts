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
type VideoSampleContext = {
  baseUrl: string
  apiKeyEnv: string
  modelName: string
  endpointPath: string
}

// 视频接口先返回任务 ID；示例必须查询任务状态，不能按聊天流读取响应。
export function buildVideoSample(
  lang: 'curl' | 'python' | 'typescript' | 'javascript',
  ctx: VideoSampleContext
): string {
  const url = `${ctx.baseUrl}${ctx.endpointPath}`
  const queryUrl = `${ctx.baseUrl}/v1/videos`
  const payload = JSON.stringify({
    model: ctx.modelName,
    prompt: '一只猫在花园里散步，镜头缓慢移动',
  })
  if (lang === 'curl') {
    const shellPayload = payload.replaceAll("'", "'\\''")
    return `TASK_ID=$(curl --fail-with-body -sS '${url}' \\
  -H "Authorization: Bearer $${ctx.apiKeyEnv}" \\
  -H 'Content-Type: application/json' \\
  -d '${shellPayload}' | jq -r '.id')

# 重复查询，直到 status 为 completed 或 failed
curl --fail-with-body -sS "${queryUrl}/$TASK_ID" \\
  -H "Authorization: Bearer $${ctx.apiKeyEnv}"

# completed 后可从 metadata.url 读取视频链接`
  }
  if (lang === 'python') {
    return `import json
import os
import time
import requests

headers = {"Authorization": "Bearer " + os.environ[${JSON.stringify(ctx.apiKeyEnv)}]}
response = requests.post(
    ${JSON.stringify(url)},
    headers=headers,
    json=json.loads(${JSON.stringify(payload)}),
    timeout=60,
)
response.raise_for_status()
task = response.json()
task_id = task["id"]

while task["status"] in ("queued", "in_progress"):
    time.sleep(5)
    response = requests.get(${JSON.stringify(queryUrl)} + "/" + task_id, headers=headers, timeout=60)
    response.raise_for_status()
    task = response.json()

if task["status"] == "failed":
    raise RuntimeError(task.get("error"))
print(task.get("metadata", {}).get("url"))`
  }
  return `const headers = {
  Authorization: 'Bearer ' + process.env[${JSON.stringify(ctx.apiKeyEnv)}],
  'Content-Type': 'application/json',
}
let response = await fetch(${JSON.stringify(url)}, {
  method: 'POST',
  headers,
  body: JSON.stringify(${payload}),
})
if (!response.ok) throw new Error(await response.text())
let task = await response.json()
const taskId = task.id

while (['queued', 'in_progress'].includes(task.status)) {
  await new Promise((resolve) => setTimeout(resolve, 5000))
  response = await fetch(${JSON.stringify(queryUrl)} + '/' + taskId, { headers })
  if (!response.ok) throw new Error(await response.text())
  task = await response.json()
}
if (task.status === 'failed') throw new Error(task.error?.message)
console.log(task.metadata?.url)`
}
