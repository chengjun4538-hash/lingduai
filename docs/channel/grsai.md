# Grsai Nano Banana 生图渠道

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
