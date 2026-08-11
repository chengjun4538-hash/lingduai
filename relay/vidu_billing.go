package relay

import (
	"fmt"
	"math"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relay/helper"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/QuantumNous/new-api/types"
	"github.com/gin-gonic/gin"
)

const viduDefaultDuration = 5

func isViduDynamicBillingModel(modelName string) bool {
	return strings.Contains(strings.ToLower(modelName), "vidu")
}

func buildViduDynamicPriceData(c *gin.Context, info *relaycommon.RelayInfo) (types.PriceData, error) {
	request, err := relaycommon.GetTaskRequest(c)
	if err != nil {
		return types.PriceData{}, err
	}

	duration, err := viduRequestDuration(request)
	if err != nil {
		return types.PriceData{}, err
	}
	resolution := ratio_setting.NormalizeViduResolution(viduRequestResolution(request))
	unitPrice, ok := ratio_setting.GetViduResolutionSecondPriceByModels(
		viduPriceModelNames(info, request),
		resolution,
	)
	if !ok {
		return types.PriceData{}, fmt.Errorf("unsupported vidu resolution: %s", resolution)
	}

	groupRatioInfo := helper.HandleGroupRatio(c, info)
	quota, clamp := common.QuotaFromFloatChecked(
		unitPrice * float64(duration) * common.QuotaPerUnit * groupRatioInfo.GroupRatio,
	)
	noteTaskQuotaClamp(info, clamp)

	priceData := types.PriceData{
		FreeModel:      groupRatioInfo.GroupRatio == 0 || unitPrice == 0,
		ModelPrice:     unitPrice,
		UsePrice:       true,
		Quota:          quota,
		GroupRatioInfo: groupRatioInfo,
	}
	priceData.AddOtherRatio("duration", float64(duration))
	priceData.AddOtherRatio("vidu_unit_price", unitPrice)
	return priceData, nil
}

func viduPriceModelNames(info *relaycommon.RelayInfo, request relaycommon.TaskSubmitReq) []string {
	modelNames := make([]string, 0, 3)
	if info != nil {
		modelNames = append(modelNames, info.OriginModelName)
		if info.ChannelMeta != nil {
			modelNames = append(modelNames, info.ChannelMeta.UpstreamModelName)
		}
	}
	return append(modelNames, request.Model)
}

func viduRequestDuration(request relaycommon.TaskSubmitReq) (int, error) {
	if request.Duration != 0 {
		return validateViduDuration(int64(request.Duration))
	}
	if request.Seconds != "" {
		value, err := strconv.ParseInt(request.Seconds, 10, 64)
		if err != nil {
			return 0, fmt.Errorf("invalid vidu duration: %q", request.Seconds)
		}
		return validateViduDuration(value)
	}
	for _, key := range []string{"duration", "seconds"} {
		if raw, ok := request.Metadata[key]; ok {
			value, err := parseViduDuration(raw)
			if err != nil {
				return 0, err
			}
			return validateViduDuration(value)
		}
	}
	return viduDefaultDuration, nil
}

func parseViduDuration(value any) (int64, error) {
	switch typed := value.(type) {
	case int:
		return int64(typed), nil
	case int64:
		return typed, nil
	case float64:
		if math.Trunc(typed) != typed || typed > math.MaxInt64 || typed < math.MinInt64 {
			return 0, fmt.Errorf("invalid vidu duration: %v", value)
		}
		return int64(typed), nil
	case string:
		parsed, err := strconv.ParseInt(typed, 10, 64)
		if err != nil {
			return 0, fmt.Errorf("invalid vidu duration: %q", typed)
		}
		return parsed, nil
	default:
		return 0, fmt.Errorf("invalid vidu duration: %v", value)
	}
}

func validateViduDuration(duration int64) (int, error) {
	if duration <= 0 || duration > relaycommon.MaxTaskDurationSeconds {
		return 0, fmt.Errorf("vidu duration must be between 1 and %d", relaycommon.MaxTaskDurationSeconds)
	}
	return int(duration), nil
}

func viduRequestResolution(request relaycommon.TaskSubmitReq) string {
	if request.Resolution != "" {
		return request.Resolution
	}
	if request.Size != "" {
		return request.Size
	}
	if value, ok := request.Metadata["resolution"].(string); ok {
		return value
	}
	if value, ok := request.Metadata["size"].(string); ok {
		return value
	}
	return ratio_setting.ViduDefaultResolution
}
