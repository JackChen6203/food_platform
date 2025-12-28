package handlers

import (
	"database/sql"
	"fmt"
	"food-platform-backend/db"
	"food-platform-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWT Secret (Should be in env var)
var jwtSecret = []byte("my_secret_key_123") // TODO: Move to Env

func Login(c *gin.Context) {
	var input struct {
		AuthProvider  string `json:"auth_provider" binding:"required"`
		AuthID        string `json:"auth_id" binding:"required"`
		Email         string `json:"email"`
		WalletAddress string `json:"wallet_address"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Upsert User (Find or Create)
	var user models.User
	var userID string

	// Check if user exists by provider+auth_id
	err := db.DB.QueryRow("SELECT id, is_merchant FROM users WHERE auth_provider = $1 AND auth_id = $2", input.AuthProvider, input.AuthID).Scan(&userID, &user.IsMerchant)

	if err == sql.ErrNoRows {
		// Create new user
		userID = fmt.Sprintf("user_%d", time.Now().UnixNano()) // Simple ID Gen
		_, err = db.DB.Exec("INSERT INTO users (id, email, auth_provider, auth_id, wallet_address) VALUES ($1, $2, $3, $4, $5)",
			userID, input.Email, input.AuthProvider, input.AuthID, input.WalletAddress)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
		user.IsMerchant = false
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// 2. Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":     userID,
		"is_merchant": user.IsMerchant,
		"exp":         time.Now().Add(time.Hour * 72).Unix(),
	})

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":       tokenString,
		"user_id":     userID,
		"is_merchant": user.IsMerchant,
	})
}

func UpdateMerchantProfile(c *gin.Context) {
	var input struct {
		UserID             string  `json:"user_id" binding:"required"`
		ShopName           string  `json:"shop_name" binding:"required"`
		Address            string  `json:"address" binding:"required"`
		Latitude           float64 `json:"latitude"`
		Longitude          float64 `json:"longitude"`
		Phone              string  `json:"phone"`
		Email              string  `json:"email"`
		BusinessHoursOpen  string  `json:"business_hours_open"`
		BusinessHoursClose string  `json:"business_hours_close"`
		Category           string  `json:"category"`
		Description        string  `json:"description"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Upsert merchant profile with new fields
	_, err := db.DB.Exec(`
		INSERT INTO merchants (user_id, shop_name, address, latitude, longitude, phone, email, business_hours_open, business_hours_close, category, description)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		ON CONFLICT (user_id) DO UPDATE 
		SET shop_name=$2, address=$3, latitude=$4, longitude=$5, phone=$6, email=$7, business_hours_open=$8, business_hours_close=$9, category=$10, description=$11
	`, input.UserID, input.ShopName, input.Address, input.Latitude, input.Longitude, input.Phone, input.Email, input.BusinessHoursOpen, input.BusinessHoursClose, input.Category, input.Description)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update merchant profile"})
		return
	}

	// Set user as merchant
	_, err = db.DB.Exec("UPDATE users SET is_merchant = TRUE WHERE id = $1", input.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Merchant profile updated"})
}
