package models

import "time"

type ProductStatus string

const (
	ProductStatusAvailable ProductStatus = "AVAILABLE"
	ProductStatusSold      ProductStatus = "SOLD"
)

type Product struct {
	ID            int           `json:"id"`
	MerchantID    string        `json:"merchant_id"` // Simplified: just a string for now
	Name          string        `json:"name"`
	OriginalPrice float64       `json:"original_price"`
	CurrentPrice  float64       `json:"current_price"`
	ExpiryDate    time.Time     `json:"expiry_date"`
	Latitude      float64       `json:"latitude"`
	Longitude     float64       `json:"longitude"`
	IsListed      bool          `json:"is_listed"`
	Status        ProductStatus `json:"status"`
}
