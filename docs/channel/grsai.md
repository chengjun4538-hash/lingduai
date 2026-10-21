# Grsai 图片与视频渠道

Grsai 渠道支持 Nano Banana 生图和 MiniMax H3 异步视频。
两者都调用上游私有接口，由适配器分别转换为网关的图片、视频 API。

## Nano Banana 生图

此渠道调用 Grsai 私有接口 `POST /v1/api/generate`，对外提供
`POST /v1/images/generations`，以 `data[].url` 返回上游图片链接。
网关不下载生成的图片，也不将图片转成 Base64。

接口依据：[Grsai Nano Banana 文档](https://qmy27nhsd9.apifox.cn/452392911e0)。

## 配置渠道

1. 新增渠道，类型选择 **Grsai**。
2. 填入 Grsai API Key。
3. 默认地址为 `https://grsaiapi.com`；国内节点可填 `https://grsai.dakka.com.cn`。
   地址填写域名即可，不追加 `/v1/api/generate`。
4. 选择需要的模型，例如 `nano-banana-2`、`nano-banana-pro`。可以使用模型映射对外提供自定义模型名。
5. 配置按次价格，或分别配置 `模型名:1k`、`模型名:2k`、`模型名:4k` 的图片价格。
   价格使用客户端请求的模型名；使用模型映射时，应为映射前的名称配置价格。

上游不返回 token 用量，此渠道要求按次或分辨率计费。支持现有分组倍率、
预扣费和失败退款流程。不要为此渠道开启请求体透传。

## 调用示例

```bash
curl 'https://你的网关地址/v1/images/generations' \
  -H "Authorization: Bearer $NEW_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "nano-banana-2",
    "prompt": "一只坐在窗边的橘猫，柔和自然光",
    "size": "2K",
    "aspect_ratio": "16:9",
    "n": 1,
    "response_format": "url"
  }'
```

成功响应的主要字段：

```json
{
  "created": 1700000000,
  "data": [
    { "url": "https://上游图片地址/image.png" }
  ]
}
```

需要参考图时，增加 `images` 数组，元素可使用图片 URL 或 Base64 字符串；
也可用 `image` 传入单个字符串或数组。两个字段不能同时使用。

## 参数与边界

| 参数 | 行为 |
| --- | --- |
| `model` | Nano Banana 系列模型名，支持渠道模型映射 |
| `prompt` | 必填提示词 |
| `size` | `1K`、`2K`、`4K` 或 `宽x高`；未指定时使用 1K |
| `imageSize` / `image_size` | 分辨率别名，支持 1K/2K/4K；与 `size` 同时出现时必须属于同一档位 |
| `aspect_ratio` / `aspectRatio` | 图片比例；未指定时从像素尺寸推导，否则使用 `auto` |
| `images` / `image` | 可选参考图，由上游读取 |
| `n` | 只能为 1，省略时默认 1 |
| `response_format` | 只能为 `url`，省略时默认返回链接 |
| `stream` | 只能为 false 或省略 |
| `replyType` | 固定使用 `json`，不支持异步任务或上游流式输出 |

像素尺寸用来确定比例及计费档位，不保证上游返回完全相同的像素尺寸。
像素总数不超过 160 万按 1K，不超过 500 万按 2K，其余按 4K；
建议直接使用分辨率档位和比例组合。

通用比例为 `auto`、`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`、
`5:4`、`4:5`、`21:9`。`nano-banana-2` 系列额外支持 `1:4`、`4:1`、`1:8`、`8:1`。
不支持 `/v1/images/edits` 的文件上传协议；图生图请在生成接口中传入参考图。

渠道参数覆盖不能修改已经确定的分辨率，也不能切换到流式、异步或多张生成。
上游提交没有幂等保证，提交后的失败和网络错误不自动重试，以免重复生成。
请求超时时上游可能仍在执行任务，需要根据上游记录核对。

后台渠道测试会调用实际生图接口，可能产生上游费用。

## MiniMax H3 视频

接口依据：[H3 提交文档](https://qmy27nhsd9.apifox.cn/514679297e0)、
[任务查询文档](https://qmy27nhsd9.apifox.cn/452409577e0)。

### 配置

渠道类型选择 **Grsai**，添加模型 `minimax-h3`，填写域名和 Grsai 密钥。
不要选择 MiniMax 渠道；两家的 API 协议不同。
如果需要对外使用别名，可配置例如 `{"h3-video":"minimax-h3"}` 的模型映射。

在模型价格 JSON 中配置 `minimax-h3:480p`、`minimax-h3:768p`、
`minimax-h3:1080p`，数值分别表示各分辨率的 **美元/秒** 售价。
也可以仅配置 `minimax-h3` 作为所有分辨率共用的每秒价格；分辨率专价优先。
使用别名时价格键也应使用别名，例如 `h3-video:768p`。
没有有效售价的档位会在请求上游前被拒绝，显式设置 0 表示免费。

费用为 `每秒价格 × 时长 × 分组倍率`，不另外叠加分辨率倍率。
预扣费、成功结算、失败退款复用现有视频任务流程。价格表会展示各档位每秒价格。

### 提交和查询

客户端调用网关 `POST /v1/videos`，也支持 `POST /v1/video/generations`：

```bash
curl 'https://你的网关地址/v1/videos' \
  -H "Authorization: Bearer $NEW_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "minimax-h3",
    "prompt": "一只猫在花园里散步，镜头缓慢移动",
    "duration": 5,
    "resolution": "768p",
    "aspect_ratio": "16:9"
  }'
```

提交返回公开任务 ID 和 `status: "queued"`，例如 `{"id":"task_xxx", ...}`。
随后用同一用户的令牌每隔数秒查询：

```bash
curl 'https://你的网关地址/v1/videos/task_xxx' \
  -H "Authorization: Bearer $NEW_API_TOKEN"
```

`status` 依次可能为 `queued`、`in_progress`，最终为 `completed` 或 `failed`。
成功时从 `metadata.url` 获取上游视频链接，也可以访问
`GET /v1/videos/task_xxx/content` 下载；失败时查看 `error.message`。
网关不把视频转成 Base64，不提供永久视频存储。

适配器向上游 `POST /v1/api/generate` 固定发送 `replyType: "async"`，
再通过 `GET /v1/api/result?id=上游任务ID` 查询。
上游 `succeeded` 映射为成功，`failed` / `violation` 映射为失败并退款。
客户端始终使用网关的公开任务 ID，不需要直接请求上游接口。

### 视频参数与边界

| 参数 | 行为 |
| --- | --- |
| `model` / `prompt` | 必填；模型映射后的名称必须为 `minimax-h3` |
| `duration` | 整数秒，默认 5；480p/768p 支持 1～15，1080p 支持 1～10 |
| `seconds` | `duration` 的整数字符串别名，例如 `"5"`；两者同时提供时必须一致 |
| `resolution` / `size` | `480p`、`768p`、`1080p`，默认 `480p`；这里的 `size` 不接受像素尺寸 |
| `aspect_ratio` / `aspectRatio` | `16:9` / `landscape` 或 `9:16` / `portrait`，默认横屏 |
| `images` | 最多 9 个参考图片 URL 或 Base64 字符串 |
| `image` / `input_reference` | 单张参考图字符串，不能与 `images` 或另一个别名同时使用 |
| `audios` | 最多 3 个参考音频 URL 或 Base64 字符串 |
| `seed` | 可选整数，显式 0 会原样发送 |
| `promptSkill` | 可选布尔值；省略时使用上游默认值，显式 false 会原样发送 |
| `metadata` | 可放上述生成参数（不含 model/prompt），不能与顶层重复定义 |
| `n` | 只能为 1，省略时也只生成一个视频 |
| `stream` / `replyType` | 不支持流式和同步返回；省略，或设置 false / async |

仅支持 JSON 请求，参考素材由上游读取，不支持 multipart 上传、remix、渠道参数覆盖。
后台渠道的同步“测试”不适用于 H3，请用上述视频 API 验证。
提交后的网络错误和上游错误不会自动换渠道重试，避免重复创建、重复计费。
若提交超时但上游已接单，需要通过上游记录核对，不能仅凭网关超时认定没有生成。
