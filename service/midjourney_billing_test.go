package service

import (
	"context"
	"testing"

	"github.com/QuantumNous/new-api/model"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func getMidjourneyTask(t *testing.T, id int) model.Midjourney {
	t.Helper()
	var task model.Midjourney
	require.NoError(t, model.DB.First(&task, id).Error)
	return task
}

// ===========================================================================
// 旧版 Midjourney 计费回归测试
// ===========================================================================

func TestPrepareMidjourneyTaskBillingKeepsUnbilledMarkerClear(t *testing.T) {
	task := &model.Midjourney{Quota: 900, TokenId: 7, BillingChannelId: 8}

	prepared, err := PrepareMidjourneyTaskBilling(&relaycommon.RelayInfo{}, task, 900, false)

	require.NoError(t, err)
	assert.False(t, prepared)
	assert.Zero(t, task.Quota)
	assert.Zero(t, task.TokenId)
	assert.Zero(t, task.BillingChannelId)
}

func TestSettleMidjourneyTaskBillingRequiresPersistedTask(t *testing.T) {
	truncate(t)

	const userID, tokenID, channelID = 49, 49, 49
	const initialUserQuota, initialTokenQuota, chargedQuota = 10000, 5000, 3000
	seedUser(t, userID, initialUserQuota)
	seedToken(t, tokenID, userID, "sk-midjourney-unpersisted", initialTokenQuota)
	seedChannel(t, channelID)

	relayInfo := &relaycommon.RelayInfo{
		UserId:    userID,
		TokenId:   tokenID,
		TokenKey:  "sk-midjourney-unpersisted",
		UserQuota: initialUserQuota,
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelId: channelID,
		},
	}
	task := &model.Midjourney{UserId: userID, ChannelId: channelID}
	prepared, err := PrepareMidjourneyTaskBilling(relayInfo, task, chargedQuota, true)
	require.NoError(t, err)
	require.True(t, prepared)

	billed, err := SettleMidjourneyTaskBilling(relayInfo, task, prepared)

	require.Error(t, err)
	assert.False(t, billed)
	assert.Equal(t, initialUserQuota, getUserQuota(t, userID))
	assert.Equal(t, initialTokenQuota, getTokenRemainQuota(t, tokenID))
}

func TestMidjourneyRefundRestoresEveryAccountingElementOnBillingChannel(t *testing.T) {
	truncate(t)
	ctx := context.Background()

	const userID, tokenID, billingChannelID, executionChannelID = 50, 50, 50, 51
	const initialUserQuota, initialTokenQuota, chargedQuota = 10000, 5000, 3000
	seedUser(t, userID, initialUserQuota)
	seedToken(t, tokenID, userID, "sk-midjourney", initialTokenQuota)
	seedChannel(t, billingChannelID)
	seedChannel(t, executionChannelID)

	relayInfo := &relaycommon.RelayInfo{
		UserId:     userID,
		TokenId:    tokenID,
		TokenKey:   "sk-midjourney",
		UserQuota:  initialUserQuota,
		UsingGroup: "default",
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelId: billingChannelID,
		},
	}
	task := &model.Midjourney{
		UserId:    userID,
		Action:    "IMAGINE",
		MjId:      "mj-accounting-refund",
		ChannelId: executionChannelID,
		Progress:  "0%",
	}

	prepared, err := PrepareMidjourneyTaskBilling(relayInfo, task, chargedQuota, true)
	require.NoError(t, err)
	require.True(t, prepared)
	assert.Equal(t, chargedQuota, task.Quota)
	assert.Zero(t, task.TokenId)
	assert.Equal(t, billingChannelID, task.BillingChannelId)
	require.NoError(t, task.Insert())

	billed, err := SettleMidjourneyTaskBilling(relayInfo, task, prepared)
	require.NoError(t, err)
	require.True(t, billed)
	assert.Equal(t, initialUserQuota-chargedQuota, getUserQuota(t, userID))
	assert.Equal(t, initialTokenQuota-chargedQuota, getTokenRemainQuota(t, tokenID))
	persisted := getMidjourneyTask(t, task.Id)
	assert.Equal(t, chargedQuota, persisted.Quota)
	assert.Equal(t, tokenID, persisted.TokenId)
	assert.Equal(t, billingChannelID, persisted.BillingChannelId)

	seedChargedAccounting(t, userID, billingChannelID, tokenID, chargedQuota, 1)

	assert.True(t, RefundMidjourneyQuota(ctx, task, "构图失败"))
	assert.Equal(t, initialUserQuota, getUserQuota(t, userID))
	assert.Equal(t, initialTokenQuota, getTokenRemainQuota(t, tokenID))
	assert.Zero(t, getTokenUsedQuota(t, tokenID))
	usedQuota, requestCount := getUserUsageAccounting(t, userID)
	assert.Zero(t, usedQuota)
	assert.Equal(t, 1, requestCount)
	assert.Zero(t, getChannelUsedQuota(t, billingChannelID))
	assert.Zero(t, getChannelUsedQuota(t, executionChannelID))

	persisted = getMidjourneyTask(t, task.Id)
	assert.Zero(t, persisted.Quota)
	assert.Equal(t, tokenID, persisted.TokenId)
	assert.Equal(t, billingChannelID, persisted.BillingChannelId)
	log := getLastLog(t)
	require.NotNil(t, log)
	assert.Equal(t, model.LogTypeRefund, log.Type)
	assert.Equal(t, chargedQuota, log.Quota)
	assert.Equal(t, tokenID, log.TokenId)
	assert.Equal(t, billingChannelID, log.ChannelId)

	assert.True(t, RefundMidjourneyQuota(ctx, task, "重复轮询"))
	assert.Equal(t, int64(1), countLogs(t))
}

func TestSettleMidjourneyTaskBillingFundingFailureClearsMarkers(t *testing.T) {
	truncate(t)

	const userID, tokenID, channelID = 52, 52, 52
	const initialUserQuota, initialTokenQuota, chargedQuota = 10000, 5000, 3000
	seedUser(t, userID, initialUserQuota)
	seedToken(t, tokenID, userID, "sk-midjourney-funding-failure", initialTokenQuota)
	seedChannel(t, channelID)

	relayInfo := &relaycommon.RelayInfo{
		UserId:    userID,
		TokenId:   tokenID,
		TokenKey:  "sk-midjourney-funding-failure",
		UserQuota: initialUserQuota,
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelId: channelID,
		},
	}
	task := &model.Midjourney{UserId: userID, MjId: "mj-funding-failure", ChannelId: channelID}
	prepared, err := PrepareMidjourneyTaskBilling(relayInfo, task, chargedQuota, true)
	require.NoError(t, err)
	require.True(t, prepared)
	require.NoError(t, task.Insert())

	require.NoError(t, model.DB.Exec(`
		CREATE TRIGGER fail_midjourney_user_update
		BEFORE UPDATE ON users
		WHEN OLD.id = 52
		BEGIN
			SELECT RAISE(ABORT, '模拟用户扣费失败');
		END;
	`).Error)
	t.Cleanup(func() {
		model.DB.Exec("DROP TRIGGER IF EXISTS fail_midjourney_user_update")
	})

	billed, err := SettleMidjourneyTaskBilling(relayInfo, task, prepared)

	require.Error(t, err)
	assert.False(t, billed)
	assert.Equal(t, initialUserQuota, getUserQuota(t, userID))
	assert.Equal(t, initialTokenQuota, getTokenRemainQuota(t, tokenID))
	persisted := getMidjourneyTask(t, task.Id)
	assert.Zero(t, persisted.Quota)
	assert.Zero(t, persisted.TokenId)
	assert.Zero(t, persisted.BillingChannelId)
	usedQuota, requestCount := getUserUsageAccounting(t, userID)
	assert.Zero(t, usedQuota)
	assert.Zero(t, requestCount)
	assert.Zero(t, getChannelUsedQuota(t, channelID))
	assert.Zero(t, countLogs(t))
}

func TestSettleMidjourneyTaskBillingTokenFailureKeepsFundingRefundable(t *testing.T) {
	truncate(t)
	ctx := context.Background()

	const userID, tokenID, channelID = 53, 53, 53
	const initialUserQuota, initialTokenQuota, chargedQuota = 10000, 5000, 3000
	seedUser(t, userID, initialUserQuota)
	seedToken(t, tokenID, userID, "sk-midjourney-token-failure", initialTokenQuota)
	seedChannel(t, channelID)

	relayInfo := &relaycommon.RelayInfo{
		UserId:    userID,
		TokenId:   tokenID,
		TokenKey:  "sk-midjourney-token-failure",
		UserQuota: initialUserQuota,
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelId: channelID,
		},
	}
	task := &model.Midjourney{UserId: userID, MjId: "mj-token-failure", ChannelId: channelID}
	prepared, err := PrepareMidjourneyTaskBilling(relayInfo, task, chargedQuota, true)
	require.NoError(t, err)
	require.True(t, prepared)
	require.NoError(t, task.Insert())

	require.NoError(t, model.DB.Exec(`
		CREATE TRIGGER fail_midjourney_token_update
		BEFORE UPDATE ON tokens
		WHEN OLD.id = 53
		BEGIN
			SELECT RAISE(ABORT, '模拟令牌扣费失败');
		END;
	`).Error)
	t.Cleanup(func() {
		model.DB.Exec("DROP TRIGGER IF EXISTS fail_midjourney_token_update")
	})

	billed, err := SettleMidjourneyTaskBilling(relayInfo, task, prepared)

	require.Error(t, err)
	require.True(t, billed)
	assert.Equal(t, initialUserQuota-chargedQuota, getUserQuota(t, userID))
	assert.Equal(t, initialTokenQuota, getTokenRemainQuota(t, tokenID))
	assert.Zero(t, getTokenUsedQuota(t, tokenID))
	persisted := getMidjourneyTask(t, task.Id)
	assert.Equal(t, chargedQuota, persisted.Quota)
	assert.Zero(t, persisted.TokenId)
	assert.Equal(t, channelID, persisted.BillingChannelId)

	seedChargedAccounting(t, userID, channelID, 0, chargedQuota, 1)
	assert.True(t, RefundMidjourneyQuota(ctx, task, "令牌结算失败"))
	assert.Equal(t, initialUserQuota, getUserQuota(t, userID))
	assert.Equal(t, initialTokenQuota, getTokenRemainQuota(t, tokenID))
	usedQuota, requestCount := getUserUsageAccounting(t, userID)
	assert.Zero(t, usedQuota)
	assert.Equal(t, 1, requestCount)
	assert.Zero(t, getChannelUsedQuota(t, channelID))
	log := getLastLog(t)
	require.NotNil(t, log)
	assert.Zero(t, log.TokenId)
}

func TestPrepareMidjourneyTaskBillingRejectsSubscriptionBeforeCharge(t *testing.T) {
	task := &model.Midjourney{Quota: 900, TokenId: 7, BillingChannelId: 8}
	relayInfo := &relaycommon.RelayInfo{BillingSource: BillingSourceSubscription, SubscriptionId: 1}

	prepared, err := PrepareMidjourneyTaskBilling(relayInfo, task, 900, true)

	require.Error(t, err)
	assert.False(t, prepared)
	assert.Zero(t, task.Quota)
	assert.Zero(t, task.TokenId)
	assert.Zero(t, task.BillingChannelId)
}

func TestRefundMidjourneyQuotaUsesLegacyChannelFallbackWithoutTokenAdjustment(t *testing.T) {
	truncate(t)
	ctx := context.Background()

	const userID, tokenID, channelID = 54, 54, 54
	const walletAfterCharge, tokenQuota, chargedQuota = 7000, 5000, 3000
	seedUser(t, userID, walletAfterCharge)
	seedToken(t, tokenID, userID, "sk-midjourney-legacy", tokenQuota)
	seedChannel(t, channelID)
	seedChargedAccounting(t, userID, channelID, 0, chargedQuota, 1)
	task := &model.Midjourney{
		UserId:    userID,
		MjId:      "mj-legacy-fallback",
		Action:    "IMAGINE",
		ChannelId: channelID,
		Quota:     chargedQuota,
		TokenId:   0,
		Progress:  "0%",
	}
	require.NoError(t, task.Insert())

	assert.True(t, RefundMidjourneyQuota(ctx, task, "旧版任务失败"))

	assert.Equal(t, walletAfterCharge+chargedQuota, getUserQuota(t, userID))
	assert.Equal(t, tokenQuota, getTokenRemainQuota(t, tokenID))
	assert.Zero(t, getTokenUsedQuota(t, tokenID))
	usedQuota, requestCount := getUserUsageAccounting(t, userID)
	assert.Zero(t, usedQuota)
	assert.Equal(t, 1, requestCount)
	assert.Zero(t, getChannelUsedQuota(t, channelID))
	log := getLastLog(t)
	require.NotNil(t, log)
	assert.Equal(t, channelID, log.ChannelId)
	assert.Zero(t, log.TokenId)
}
