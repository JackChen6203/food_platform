package handlers

import (
	"database/sql"
	"fmt"
	"food-platform-backend/db"
	"food-platform-backend/models"
	"log"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// In-memory store for verification codes (use Redis in production)
var smsCodeStore = struct {
	sync.RWMutex
	codes map[string]smsCodeEntry
}{codes: make(map[string]smsCodeEntry)}

type smsCodeEntry struct {
	Code      string
	ExpiresAt time.Time
}

// SendSMSCode generates and "sends" a verification code
// In demo mode, it logs the code to console
func SendSMSCode(c *gin.Context) {
	var input struct {
		Phone string `json:"phone" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Phone number is required"})
		return
	}

	// Validate phone format (basic)
	if len(input.Phone) < 9 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid phone number"})
		return
	}

	// Generate 6-digit code
	code := fmt.Sprintf("%06d", rand.Intn(1000000))

	// Store code with 5-minute expiry
	smsCodeStore.Lock()
	smsCodeStore.codes[input.Phone] = smsCodeEntry{
		Code:      code,
		ExpiresAt: time.Now().Add(5 * time.Minute),
	}
	smsCodeStore.Unlock()

	// DEMO MODE: Log the code (replace with actual SMS service in production)
	log.Printf("📱 [SMS DEMO] Verification code for %s: %s", input.Phone, code)

	// TODO: Integrate with real SMS service (Twilio, AWS SNS, etc.)
	// Example:
	// err := sendTwilioSMS(input.Phone, fmt.Sprintf("Your verification code is: %s", code))
	// if err != nil {
	//     c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send SMS"})
	//     return
	// }

	c.JSON(http.StatusOK, gin.H{
		"message": "Verification code sent",
		"demo":    true, // Remove in production
	})
}

// VerifySMSCode verifies the code and creates/logs in the user
func VerifySMSCode(c *gin.Context) {
	var input struct {
		Phone string `json:"phone" binding:"required"`
		Code  string `json:"code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Phone and code are required"})
		return
	}

	// Validate code format
	if len(input.Code) != 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid code format"})
		return
	}

	// Check stored code
	smsCodeStore.RLock()
	entry, exists := smsCodeStore.codes[input.Phone]
	smsCodeStore.RUnlock()

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No verification code found. Please request a new one."})
		return
	}

	if time.Now().After(entry.ExpiresAt) {
		// Clean up expired code
		smsCodeStore.Lock()
		delete(smsCodeStore.codes, input.Phone)
		smsCodeStore.Unlock()
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Verification code expired. Please request a new one."})
		return
	}

	if entry.Code != input.Code {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid verification code"})
		return
	}

	// Code is valid - clean up
	smsCodeStore.Lock()
	delete(smsCodeStore.codes, input.Phone)
	smsCodeStore.Unlock()

	// Find or create user by phone
	var user models.User
	var userID string

	err := db.DB.QueryRow("SELECT id, is_merchant FROM users WHERE phone = $1", input.Phone).Scan(&userID, &user.IsMerchant)

	if err == sql.ErrNoRows {
		// Create new user
		userID = fmt.Sprintf("user_%d", time.Now().UnixNano())
		_, err = db.DB.Exec(
			"INSERT INTO users (id, phone, phone_verified, auth_provider, auth_id) VALUES ($1, $2, TRUE, 'phone', $2)",
			userID, input.Phone,
		)
		if err != nil {
			log.Printf("[SMS] Failed to create user: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
		user.IsMerchant = false
		log.Printf("📱 [SMS] New user created: %s (phone: %s)", userID, input.Phone)
	} else if err != nil {
		log.Printf("[SMS] Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	} else {
		log.Printf("📱 [SMS] Existing user logged in: %s (phone: %s)", userID, input.Phone)
	}

	// Generate JWT
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
		"phone":       input.Phone,
	})
}
