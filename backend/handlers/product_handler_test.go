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
// PRODUCT HANDLER TESTS
// =========================================================================

func TestCreateProductEmptyBody(t *testing.T) {
	router := gin.New()
	router.POST("/products", CreateProduct)

	req, _ := http.NewRequest("POST", "/products", bytes.NewBuffer([]byte("{}")))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestCreateProductMissingFields(t *testing.T) {
	router := gin.New()
	router.POST("/products", CreateProduct)

	body := map[string]interface{}{
		"merchant_id": "test_merchant",
		"name":        "Test Product",
		// Missing price fields
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/products", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestPurchaseProductNoBody(t *testing.T) {
	router := gin.New()
	router.POST("/purchase/:id", PurchaseProduct)

	req, _ := http.NewRequest("POST", "/purchase/999", bytes.NewBuffer([]byte("{}")))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestDistanceCalculation(t *testing.T) {
	// Test Haversine formula
	// Taipei 101 to Taipei Main Station (~2.5km)
	taipei101Lat := 25.0330
	taipei101Lon := 121.5654
	mainStationLat := 25.0478
	mainStationLon := 121.5170

	dist := distance(taipei101Lat, taipei101Lon, mainStationLat, mainStationLon)

	// Should be approximately 5-6 km
	assert.True(t, dist > 4 && dist < 7, "Distance should be between 4-7 km")
}
