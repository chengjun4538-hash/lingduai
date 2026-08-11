package dto

import (
	"encoding/json"
	"testing"

	kitutil "github.com/QuantumNous/new-api/relaykit/relayconvert/kitutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGeminiChatRequestPreservesCompatibleUpstreamFields(t *testing.T) {
	raw := []byte(`{
		"contents":[{"role":"user","parts":[{"text":"生成一张高质感商业海报"}]}],
		"aspectRatio":"3:2",
		"imageSize":"2K",
		"vendorBoolean":false,
		"vendorNumber":0,
		"vendorArray":["png",2],
		"vendorObject":{"watermark":false},
		"vendorNull":null,
		"generationConfig":{
			"responseModalities":["IMAGE"],
			"responseFormat":{"image":{"aspectRatio":"16:9","imageSize":"4K"}},
			"futureOption":{"enabled":true}
		}
	}`)

	var request GeminiChatRequest
	require.NoError(t, kitutil.Unmarshal(raw, &request))

	encoded, err := kitutil.Marshal(request)
	require.NoError(t, err)
	var copied GeminiChatRequest
	require.NoError(t, kitutil.Unmarshal(encoded, &copied))
	encoded, err = kitutil.Marshal(copied)
	require.NoError(t, err)

	var output map[string]json.RawMessage
	require.NoError(t, kitutil.Unmarshal(encoded, &output))
	assert.JSONEq(t, `"3:2"`, string(output["aspectRatio"]))
	assert.JSONEq(t, `"2K"`, string(output["imageSize"]))
	assert.JSONEq(t, `false`, string(output["vendorBoolean"]))
	assert.JSONEq(t, `0`, string(output["vendorNumber"]))
	assert.JSONEq(t, `["png",2]`, string(output["vendorArray"]))
	assert.JSONEq(t, `{"watermark":false}`, string(output["vendorObject"]))
	assert.JSONEq(t, `null`, string(output["vendorNull"]))

	var generationConfig map[string]json.RawMessage
	require.NoError(t, kitutil.Unmarshal(output["generationConfig"], &generationConfig))
	assert.JSONEq(t, `{"image":{"aspectRatio":"16:9","imageSize":"4K"}}`, string(generationConfig["responseFormat"]))
	assert.JSONEq(t, `{"enabled":true}`, string(generationConfig["futureOption"]))
}

func TestGeminiChatRequestKnownFieldsTakePrecedenceOverExtraFields(t *testing.T) {
	raw := []byte(`{
		"contents":[{"parts":[{"text":"原始内容"}]}],
		"system_instruction":{"parts":[{"text":"原始系统提示"}]},
		"customTopLevel":"保留",
		"generationConfig":{"top_p":0.25,"customGenerationConfig":"保留"}
	}`)

	var request GeminiChatRequest
	require.NoError(t, kitutil.Unmarshal(raw, &request))

	request.Contents[0].Parts[0].Text = "修改后的内容"
	request.SystemInstructions.Parts[0].Text = "修改后的系统提示"
	request.Extra["contents"] = json.RawMessage(`[{"parts":[{"text":"不应覆盖"}]}]`)
	topP := 0.75
	request.GenerationConfig.TopP = &topP
	request.GenerationConfig.Extra["topP"] = json.RawMessage(`0.99`)

	encoded, err := kitutil.Marshal(request)
	require.NoError(t, err)

	var output map[string]json.RawMessage
	require.NoError(t, kitutil.Unmarshal(encoded, &output))
	assert.NotContains(t, output, "system_instruction")
	assert.JSONEq(t, `"保留"`, string(output["customTopLevel"]))

	var contents []GeminiChatContent
	require.NoError(t, kitutil.Unmarshal(output["contents"], &contents))
	require.Len(t, contents, 1)
	require.Len(t, contents[0].Parts, 1)
	assert.Equal(t, "修改后的内容", contents[0].Parts[0].Text)

	var systemInstruction GeminiChatContent
	require.NoError(t, kitutil.Unmarshal(output["systemInstruction"], &systemInstruction))
	require.Len(t, systemInstruction.Parts, 1)
	assert.Equal(t, "修改后的系统提示", systemInstruction.Parts[0].Text)

	var generationConfig map[string]json.RawMessage
	require.NoError(t, kitutil.Unmarshal(output["generationConfig"], &generationConfig))
	assert.NotContains(t, generationConfig, "top_p")
	assert.JSONEq(t, `0.75`, string(generationConfig["topP"]))
	assert.JSONEq(t, `"保留"`, string(generationConfig["customGenerationConfig"]))
}
