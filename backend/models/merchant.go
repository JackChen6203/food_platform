package models

import "time"

type Merchant struct {
	UserID    string    `json:"user_id"`
	ShopName  string    `json:"shop_name"`
	Address   string    `json:"address"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	CreatedAt time.Time `json:"created_at"`
}
