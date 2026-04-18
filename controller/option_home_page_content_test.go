package controller

import (
	"fmt"
	"net/http"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

type optionAPIResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

func setupOptionControllerTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	gin.SetMode(gin.TestMode)

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite db: %v", err)
	}

	model.DB = db
	model.LOG_DB = db
	common.OptionMap = map[string]string{
		"HomePageContent": "",
	}

	if err := db.AutoMigrate(&model.Option{}); err != nil {
		t.Fatalf("failed to migrate option table: %v", err)
	}

	t.Cleanup(func() {
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})

	return db
}

func decodeOptionAPIResponse(t *testing.T, recorderBody []byte) optionAPIResponse {
	t.Helper()

	var response optionAPIResponse
	if err := common.Unmarshal(recorderBody, &response); err != nil {
		t.Fatalf("failed to decode option api response: %v", err)
	}
	return response
}

func TestUpdateOptionAcceptsSiteConfigJSONObject(t *testing.T) {
	db := setupOptionControllerTestDB(t)
	rawConfig := `{"nav":{"docs":{"url":"https://example.com/docs"}},"home":{"hiddenSections":["faq"]}}`

	ctx, recorder := newAuthenticatedContext(t, http.MethodPut, "/api/option/", map[string]any{
		"key":   "HomePageContent",
		"value": rawConfig,
	}, 1)

	UpdateOption(ctx)

	response := decodeOptionAPIResponse(t, recorder.Body.Bytes())
	if !response.Success {
		t.Fatalf("expected success response, got message: %s", response.Message)
	}

	var option model.Option
	if err := db.First(&option, "key = ?", "HomePageContent").Error; err != nil {
		t.Fatalf("failed to query saved option: %v", err)
	}
	if option.Value != rawConfig {
		t.Fatalf("expected saved config %q, got %q", rawConfig, option.Value)
	}
	if common.OptionMap["HomePageContent"] != rawConfig {
		t.Fatalf("expected option map to be updated, got %q", common.OptionMap["HomePageContent"])
	}
}

func TestUpdateOptionRejectsInvalidSiteConfigJSON(t *testing.T) {
	db := setupOptionControllerTestDB(t)

	ctx, recorder := newAuthenticatedContext(t, http.MethodPut, "/api/option/", map[string]any{
		"key":   "HomePageContent",
		"value": `{"nav":`,
	}, 1)

	UpdateOption(ctx)

	response := decodeOptionAPIResponse(t, recorder.Body.Bytes())
	if response.Success {
		t.Fatalf("expected failure response for invalid JSON")
	}
	if response.Message != "站点配置不是合法的 JSON 字符串" {
		t.Fatalf("unexpected error message: %s", response.Message)
	}

	var count int64
	if err := db.Model(&model.Option{}).Count(&count).Error; err != nil {
		t.Fatalf("failed to count options: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected invalid JSON not to be saved, got %d records", count)
	}
}

func TestUpdateOptionRejectsNonObjectSiteConfig(t *testing.T) {
	db := setupOptionControllerTestDB(t)

	ctx, recorder := newAuthenticatedContext(t, http.MethodPut, "/api/option/", map[string]any{
		"key":   "HomePageContent",
		"value": `["home"]`,
	}, 1)

	UpdateOption(ctx)

	response := decodeOptionAPIResponse(t, recorder.Body.Bytes())
	if response.Success {
		t.Fatalf("expected failure response for non-object JSON")
	}
	if response.Message != "站点配置必须是 JSON 对象" {
		t.Fatalf("unexpected error message: %s", response.Message)
	}

	var count int64
	if err := db.Model(&model.Option{}).Count(&count).Error; err != nil {
		t.Fatalf("failed to count options: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected non-object JSON not to be saved, got %d records", count)
	}
}
