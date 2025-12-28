package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// =========================================================================
// AUTH HANDLER TESTS
// =========================================================================

func TestLoginEmptyBody(t *testing.T) {
	router := gin.New()
	router.POST("/login", Login)

	req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer([]byte("{}")))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestLoginValidInput(t *testing.T) {
	// This test requires a database connection
	// Skip if no DB available
	t.Skip("Requires database connection")

	router := gin.New()
	router.POST("/login", Login)

	body := map[string]string{
		"auth_provider": "google",
		"auth_id":       "test_user_123",
		"email":         "test@example.com",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestUpdateMerchantProfileEmptyBody(t *testing.T) {
	router := gin.New()
	router.POST("/merchant/setup", UpdateMerchantProfile)

	req, _ := http.NewRequest("POST", "/merchant/setup", bytes.NewBuffer([]byte("{}")))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestUpdateMerchantProfileMissingFields(t *testing.T) {
	router := gin.New()
	router.POST("/merchant/setup", UpdateMerchantProfile)

	body := map[string]string{
		"user_id": "test_user",
		// Missing shop_name and address
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/merchant/setup", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}
