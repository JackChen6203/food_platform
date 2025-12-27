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

	r.GET("/products", handlers.GetProducts)
	r.POST("/products", handlers.CreateProduct)
	r.POST("/purchase/:id", handlers.PurchaseProduct)

	// Listen on PORT provided by Cloud Run, or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
