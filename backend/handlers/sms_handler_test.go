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

// =========================================================================
// SMS HANDLER TESTS
// =========================================================================

func TestSendSMSCodeEmptyPhone(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/register/send-sms", SendSMSCode)

	req, _ := http.NewRequest("POST", "/register/send-sms", bytes.NewBuffer([]byte("{}")))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSendSMSCodeShortPhone(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/register/send-sms", SendSMSCode)

	body := map[string]string{"phone": "12345"}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/register/send-sms", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSendSMSCodeValidPhone(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/register/send-sms", SendSMSCode)

	body := map[string]string{"phone": "0912345678"}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/register/send-sms", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "Verification code sent", response["message"])
}

func TestVerifySMSCodeEmptyInput(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/register/verify-sms", VerifySMSCode)

	req, _ := http.NewRequest("POST", "/register/verify-sms", bytes.NewBuffer([]byte("{}")))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestVerifySMSCodeInvalidFormat(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/register/verify-sms", VerifySMSCode)

	body := map[string]string{"phone": "0912345678", "code": "12345"} // 5 digits instead of 6
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/register/verify-sms", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestVerifySMSCodeNoCodeRequested(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/register/verify-sms", VerifySMSCode)

	body := map[string]string{"phone": "0911111111", "code": "123456"}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/register/verify-sms", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 401 because no code was requested for this phone
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestVerifySMSCodeWrongCode(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// First, send a code
	sendRouter := gin.New()
	sendRouter.POST("/register/send-sms", SendSMSCode)

	sendBody := map[string]string{"phone": "0922222222"}
	sendJson, _ := json.Marshal(sendBody)

	sendReq, _ := http.NewRequest("POST", "/register/send-sms", bytes.NewBuffer(sendJson))
	sendReq.Header.Set("Content-Type", "application/json")

	sendW := httptest.NewRecorder()
	sendRouter.ServeHTTP(sendW, sendReq)
	assert.Equal(t, http.StatusOK, sendW.Code)

	// Now try to verify with wrong code
	verifyRouter := gin.New()
	verifyRouter.POST("/register/verify-sms", VerifySMSCode)

	verifyBody := map[string]string{"phone": "0922222222", "code": "000000"}
	verifyJson, _ := json.Marshal(verifyBody)

	verifyReq, _ := http.NewRequest("POST", "/register/verify-sms", bytes.NewBuffer(verifyJson))
	verifyReq.Header.Set("Content-Type", "application/json")

	verifyW := httptest.NewRecorder()
	verifyRouter.ServeHTTP(verifyW, verifyReq)

	assert.Equal(t, http.StatusUnauthorized, verifyW.Code)
}
