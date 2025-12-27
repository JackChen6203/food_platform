package handlers

import (
	"database/sql"
	"fmt"
	"food-platform-backend/db"
	"food-platform-backend/models"
	"math"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// Helper: Haversine
func distance(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371 // Radius of the earth in km
	dLat := (lat2 - lat1) * (math.Pi / 180)
	dLon := (lon2 - lon1) * (math.Pi / 180)
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*(math.Pi/180))*math.Cos(lat2*(math.Pi/180))*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

// === Merchant API ===

func CreateProduct(c *gin.Context) {
	var input struct {
		MerchantID    string  `json:"merchant_id" binding:"required"`
		Name          string  `json:"name" binding:"required"`
		OriginalPrice float64 `json:"original_price" binding:"required"`
		CurrentPrice  float64 `json:"current_price" binding:"required"`
		ExpiryMinutes int     `json:"expiry_minutes" binding:"required"`
		Latitude      float64 `json:"latitude" binding:"required"`
		Longitude     float64 `json:"longitude" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	expiryDate := time.Now().Add(time.Duration(input.ExpiryMinutes) * time.Minute)

	var productID int
	query := `
		INSERT INTO products (merchant_id, name, original_price, current_price, expiry_date, latitude, longitude, is_listed, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, true, 'AVAILABLE')
		RETURNING id
	`
	err := db.DB.QueryRow(query, input.MerchantID, input.Name, input.OriginalPrice, input.CurrentPrice, expiryDate, input.Latitude, input.Longitude).Scan(&productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product listing created", "id": productID})
}

// === Consumer API ===

func GetProducts(c *gin.Context) {
	// Simple auto-listing logic for demo: if expired, maybe delist?
	// Or we keep the requested logic: listing valid items.

	// Filter: Status=AVAILABLE and Expiry > Now
	rows, err := db.DB.Query(`
		SELECT id, merchant_id, name, original_price, current_price, expiry_date, latitude, longitude, is_listed, status 
		FROM products 
		WHERE status = 'AVAILABLE' AND expiry_date > NOW()
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(&p.ID, &p.MerchantID, &p.Name, &p.OriginalPrice, &p.CurrentPrice, &p.ExpiryDate, &p.Latitude, &p.Longitude, &p.IsListed, &p.Status); err != nil {
			continue
		}
		products = append(products, p)
	}

	c.JSON(http.StatusOK, products)
}

func PurchaseProduct(c *gin.Context) {
	productID := c.Param("id")
	var input struct {
		ConsumerID string `json:"consumer_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Consumer ID required"})
		return
	}

	// 1. Start Transaction
	tx, err := db.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction begin failed"})
		return
	}
	defer tx.Rollback() // Rollback if not committed

	// 2. Lock Row (Pessimistic Locking)
	var status string
	var expiry time.Time

	// FOR UPDATE ensures no one else can read/write this row until we commit/rollback
	err = tx.QueryRow("SELECT status, expiry_date FROM products WHERE id = $1 FOR UPDATE", productID).Scan(&status, &expiry)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// 3. Validation
	if status == "SOLD" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product already sold"})
		return
	}
	if time.Now().After(expiry) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product expired"})
		return
	}

	// 4. Update Product Status
	_, err = tx.Exec("UPDATE products SET status = 'SOLD' WHERE id = $1", productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	// 5. Create Order Record
	_, err = tx.Exec("INSERT INTO orders (product_id, consumer_id) VALUES ($1, $2)", productID, input.ConsumerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	// 6. Commit Transaction
	err = tx.Commit()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Commit failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Purchase successful! Enjoy your food."})
}

// Legacy demo seed
func SeedData(c *gin.Context) {
	query := `INSERT INTO products (name, original_price, current_price, expiry_date, latitude, longitude, is_listed, status, merchant_id) VALUES 
	('Sushi Box', 200, 100, NOW() + INTERVAL '2 hours', 25.0335, 121.5650, true, 'AVAILABLE', 'm1'),
	('Bread', 50, 25, NOW() + INTERVAL '5 hours', 25.0340, 121.5660, true, 'AVAILABLE', 'm1'),
	('Milk', 90, 45, NOW() + INTERVAL '10 hours', 25.0320, 121.5640, true, 'AVAILABLE', 'm2')`

	_, err := db.DB.Exec(query)
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "Seeded"})
}
