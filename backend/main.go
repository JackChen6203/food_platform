package main

import (
	"food-platform-backend/db"
	"food-platform-backend/handlers"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	db.InitDB()

	r := gin.Default()

	// Helper to seed data easily
	r.POST("/seed", handlers.SeedData)

	// Products
	r.GET("/products", handlers.GetProducts)
	r.POST("/products", handlers.CreateProduct)
	r.POST("/purchase/:id", handlers.PurchaseProduct)

	// Auth Routes
	r.POST("/login", handlers.Login)
	r.POST("/merchant/setup", handlers.UpdateMerchantProfile)

	// =========================================================================
	// NEW ROUTES: Social Features
	// =========================================================================

	// Reviews
	r.POST("/reviews", handlers.CreateReview)
	r.GET("/reviews/merchant/:merchant_id", handlers.GetMerchantReviews)

	// Favorites
	r.POST("/favorites/toggle", handlers.ToggleFavorite)
	r.GET("/favorites/:user_id", handlers.GetUserFavorites)
	r.GET("/favorites/check", handlers.IsFavorite)

	// Notifications
	r.GET("/notifications/:user_id", handlers.GetNotifications)
	r.PUT("/notifications/:id/read", handlers.MarkNotificationRead)
	r.POST("/notifications", handlers.CreateNotification)

	// Merchant Details & Search
	r.GET("/merchant/:merchant_id", handlers.GetMerchantDetails)
	r.GET("/merchants/search", handlers.SearchMerchants)

	// Listen on PORT provided by Cloud Run, or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
