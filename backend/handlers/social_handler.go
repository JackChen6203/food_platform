package handlers

import (
	"database/sql"
	"food-platform-backend/db"
	"food-platform-backend/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// =========================================================================
// REVIEWS
// =========================================================================

// CreateReview - POST /reviews
func CreateReview(c *gin.Context) {
	var input struct {
		OrderID    int    `json:"order_id" binding:"required"`
		UserID     string `json:"user_id" binding:"required"`
		MerchantID string `json:"merchant_id" binding:"required"`
		Rating     int    `json:"rating" binding:"required,min=1,max=5"`
		Comment    string `json:"comment"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := db.DB.Exec(`
		INSERT INTO reviews (order_id, user_id, merchant_id, rating, comment)
		VALUES ($1, $2, $3, $4, $5)
	`, input.OrderID, input.UserID, input.MerchantID, input.Rating, input.Comment)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create review"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Review created"})
}

// GetMerchantReviews - GET /reviews/merchant/:merchant_id
func GetMerchantReviews(c *gin.Context) {
	merchantID := c.Param("merchant_id")

	rows, err := db.DB.Query(`
		SELECT id, order_id, user_id, merchant_id, rating, comment, created_at
		FROM reviews WHERE merchant_id = $1 ORDER BY created_at DESC
	`, merchantID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}
	defer rows.Close()

	var reviews []models.Review
	for rows.Next() {
		var r models.Review
		rows.Scan(&r.ID, &r.OrderID, &r.UserID, &r.MerchantID, &r.Rating, &r.Comment, &r.CreatedAt)
		reviews = append(reviews, r)
	}

	// Calculate average rating
	var avgRating float64
	db.DB.QueryRow("SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE merchant_id = $1", merchantID).Scan(&avgRating)

	c.JSON(http.StatusOK, gin.H{
		"reviews":        reviews,
		"average_rating": avgRating,
		"total_reviews":  len(reviews),
	})
}

// =========================================================================
// FAVORITES
// =========================================================================

// ToggleFavorite - POST /favorites/toggle
func ToggleFavorite(c *gin.Context) {
	var input struct {
		UserID     string `json:"user_id" binding:"required"`
		MerchantID string `json:"merchant_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if already favorited
	var exists bool
	err := db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM favorites WHERE user_id = $1 AND merchant_id = $2)",
		input.UserID, input.MerchantID).Scan(&exists)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if exists {
		// Remove favorite
		db.DB.Exec("DELETE FROM favorites WHERE user_id = $1 AND merchant_id = $2", input.UserID, input.MerchantID)
		c.JSON(http.StatusOK, gin.H{"message": "Removed from favorites", "is_favorite": false})
	} else {
		// Add favorite
		db.DB.Exec("INSERT INTO favorites (user_id, merchant_id) VALUES ($1, $2)", input.UserID, input.MerchantID)
		c.JSON(http.StatusOK, gin.H{"message": "Added to favorites", "is_favorite": true})
	}
}

// GetUserFavorites - GET /favorites/:user_id
func GetUserFavorites(c *gin.Context) {
	userID := c.Param("user_id")

	rows, err := db.DB.Query(`
		SELECT f.id, f.merchant_id, m.shop_name, m.address, m.category, f.created_at
		FROM favorites f
		JOIN merchants m ON f.merchant_id = m.user_id
		WHERE f.user_id = $1
		ORDER BY f.created_at DESC
	`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch favorites"})
		return
	}
	defer rows.Close()

	type FavoriteWithMerchant struct {
		ID         int    `json:"id"`
		MerchantID string `json:"merchant_id"`
		ShopName   string `json:"shop_name"`
		Address    string `json:"address"`
		Category   string `json:"category"`
	}

	var favorites []FavoriteWithMerchant
	for rows.Next() {
		var f FavoriteWithMerchant
		var createdAt interface{}
		rows.Scan(&f.ID, &f.MerchantID, &f.ShopName, &f.Address, &f.Category, &createdAt)
		favorites = append(favorites, f)
	}

	c.JSON(http.StatusOK, favorites)
}

// =========================================================================
// NOTIFICATIONS
// =========================================================================

// GetNotifications - GET /notifications/:user_id
func GetNotifications(c *gin.Context) {
	userID := c.Param("user_id")

	rows, err := db.DB.Query(`
		SELECT id, user_id, title, body, type, is_read, created_at
		FROM notifications WHERE user_id = $1
		ORDER BY created_at DESC LIMIT 50
	`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}
	defer rows.Close()

	var notifications []models.Notification
	for rows.Next() {
		var n models.Notification
		rows.Scan(&n.ID, &n.UserID, &n.Title, &n.Body, &n.Type, &n.IsRead, &n.CreatedAt)
		notifications = append(notifications, n)
	}

	// Count unread
	var unreadCount int
	db.DB.QueryRow("SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE", userID).Scan(&unreadCount)

	c.JSON(http.StatusOK, gin.H{
		"notifications": notifications,
		"unread_count":  unreadCount,
	})
}

// MarkNotificationRead - PUT /notifications/:id/read
func MarkNotificationRead(c *gin.Context) {
	id := c.Param("id")

	_, err := db.DB.Exec("UPDATE notifications SET is_read = TRUE WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

// CreateNotification - POST /notifications (for system/merchant use)
func CreateNotification(c *gin.Context) {
	var input struct {
		UserID string `json:"user_id" binding:"required"`
		Title  string `json:"title" binding:"required"`
		Body   string `json:"body"`
		Type   string `json:"type"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Type == "" {
		input.Type = "general"
	}

	_, err := db.DB.Exec(`
		INSERT INTO notifications (user_id, title, body, type)
		VALUES ($1, $2, $3, $4)
	`, input.UserID, input.Title, input.Body, input.Type)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Notification created"})
}

// =========================================================================
// MERCHANT INFO (Enhanced)
// =========================================================================

// GetMerchantDetails - GET /merchant/:merchant_id
func GetMerchantDetails(c *gin.Context) {
	merchantID := c.Param("merchant_id")

	var m struct {
		UserID             string  `json:"user_id"`
		ShopName           string  `json:"shop_name"`
		Address            string  `json:"address"`
		Latitude           float64 `json:"latitude"`
		Longitude          float64 `json:"longitude"`
		Phone              string  `json:"phone"`
		Email              string  `json:"email"`
		BusinessHoursOpen  string  `json:"business_hours_open"`
		BusinessHoursClose string  `json:"business_hours_close"`
		Category           string  `json:"category"`
		Description        string  `json:"description"`
	}

	err := db.DB.QueryRow(`
		SELECT user_id, COALESCE(shop_name,''), COALESCE(address,''), COALESCE(latitude,0), COALESCE(longitude,0),
		       COALESCE(phone,''), COALESCE(email,''), COALESCE(business_hours_open,''), COALESCE(business_hours_close,''),
		       COALESCE(category,''), COALESCE(description,'')
		FROM merchants WHERE user_id = $1
	`, merchantID).Scan(&m.UserID, &m.ShopName, &m.Address, &m.Latitude, &m.Longitude,
		&m.Phone, &m.Email, &m.BusinessHoursOpen, &m.BusinessHoursClose, &m.Category, &m.Description)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Merchant not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Get average rating
	var avgRating float64
	var totalReviews int
	db.DB.QueryRow("SELECT COALESCE(AVG(rating), 0), COUNT(*) FROM reviews WHERE merchant_id = $1", merchantID).Scan(&avgRating, &totalReviews)

	// Get product count
	var productCount int
	db.DB.QueryRow("SELECT COUNT(*) FROM products WHERE merchant_id = $1 AND status = 'AVAILABLE'", merchantID).Scan(&productCount)

	c.JSON(http.StatusOK, gin.H{
		"merchant":       m,
		"average_rating": avgRating,
		"total_reviews":  totalReviews,
		"product_count":  productCount,
	})
}

// IsFavorite - GET /favorites/check?user_id=xxx&merchant_id=yyy
func IsFavorite(c *gin.Context) {
	userID := c.Query("user_id")
	merchantID := c.Query("merchant_id")

	var exists bool
	db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM favorites WHERE user_id = $1 AND merchant_id = $2)",
		userID, merchantID).Scan(&exists)

	c.JSON(http.StatusOK, gin.H{"is_favorite": exists})
}

// SearchMerchants - GET /merchants/search?q=xxx&category=xxx
func SearchMerchants(c *gin.Context) {
	query := c.Query("q")
	category := c.Query("category")

	sqlQuery := `
		SELECT user_id, COALESCE(shop_name,''), COALESCE(address,''), COALESCE(category,'')
		FROM merchants WHERE 1=1
	`
	args := []interface{}{}
	argIndex := 1

	if query != "" {
		sqlQuery += " AND (shop_name ILIKE $" + strconv.Itoa(argIndex) + " OR address ILIKE $" + strconv.Itoa(argIndex) + ")"
		args = append(args, "%"+query+"%")
		argIndex++
	}

	if category != "" {
		sqlQuery += " AND category = $" + strconv.Itoa(argIndex)
		args = append(args, category)
	}

	sqlQuery += " LIMIT 20"

	rows, err := db.DB.Query(sqlQuery, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search failed"})
		return
	}
	defer rows.Close()

	type MerchantSummary struct {
		UserID   string `json:"user_id"`
		ShopName string `json:"shop_name"`
		Address  string `json:"address"`
		Category string `json:"category"`
	}

	var merchants []MerchantSummary
	for rows.Next() {
		var m MerchantSummary
		rows.Scan(&m.UserID, &m.ShopName, &m.Address, &m.Category)
		merchants = append(merchants, m)
	}

	c.JSON(http.StatusOK, merchants)
}
