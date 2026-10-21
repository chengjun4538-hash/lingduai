package relay

import (
	"fmt"

	"github.com/QuantumNous/new-api/common"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relay/helper"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/QuantumNous/new-api/types"
	"github.com/gin-gonic/gin"
)

func buildGrsaiVideoPriceData(c *gin.Context, info *relaycommon.RelayInfo) (types.PriceData, error) {
	if info.UpstreamModelName != "minimax-h3" {
		return types.PriceData{}, fmt.Errorf("Grsai 视频只支持 minimax-h3，请检查模型映射")
	}
	request, err := relaycommon.GetTaskRequest(c)
	if err != nil {
		return types.PriceData{}, err
	}
	maxDuration := 15
	if request.Resolution == "1080p" {
		maxDuration = 10
	}
	if request.Duration < 1 || request.Duration > relaycommon.MaxTaskDurationSeconds || request.Duration > maxDuration {
		return types.PriceData{}, fmt.Errorf("Grsai 视频时长超出支持范围")
	}
	unitPrice, ok := ratio_setting.GetGrsaiVideoSecondPrice(info.OriginModelName, request.Resolution)
	if !ok {
		return types.PriceData{}, fmt.Errorf("请为 %s:%s 配置有效的每秒价格", info.OriginModelName, request.Resolution)
	}
	groupRatio := helper.HandleGroupRatio(c, info)
	quota, clamp := common.QuotaFromFloatChecked(unitPrice * float64(request.Duration) * common.QuotaPerUnit * groupRatio.GroupRatio)
	noteTaskQuotaClamp(info, clamp)
	price := types.PriceData{
		ModelPrice: unitPrice, UsePrice: true, Quota: quota,
		FreeModel:      unitPrice == 0 || groupRatio.GroupRatio == 0,
		GroupRatioInfo: groupRatio,
	}
	price.AddOtherRatio("duration", float64(request.Duration))
	return price, nil
}
