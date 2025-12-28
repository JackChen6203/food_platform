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
// SOCIAL HANDLER TESTS
// =========================================================================

func TestCreateReviewEmptyBody(t *testing.T) {
	router := gin.New()
	router.POST("/reviews", CreateReview)

	req, _ := http.NewRequest("POST", "/reviews", bytes.NewBuffer([]byte("{}")))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestCreateReviewInvalidRating(t *testing.T) {
	router := gin.New()
	router.POST("/reviews", CreateReview)

	body := map[string]interface{}{
		"order_id":    1,
		"user_id":     "user1",
		"merchant_id": "merchant1",
		"rating":      6, // Invalid: should be 1-5
		"comment":     "Great!",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/reviews", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestToggleFavoriteEmptyBody(t *testing.T) {
	router := gin.New()
	router.POST("/favorites/toggle", ToggleFavorite)

	req, _ := http.NewRequest("POST", "/favorites/toggle", bytes.NewBuffer([]byte("{}")))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestCreateNotificationEmptyBody(t *testing.T) {
	router := gin.New()
	router.POST("/notifications", CreateNotification)

	req, _ := http.NewRequest("POST", "/notifications", bytes.NewBuffer([]byte("{}")))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestCreateNotificationMissingTitle(t *testing.T) {
	router := gin.New()
	router.POST("/notifications", CreateNotification)

	body := map[string]interface{}{
		"user_id": "user1",
		// Missing title
		"body": "Test body",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/notifications", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}
