package models

import "time"

type Merchant struct {
	UserID             string    `json:"user_id"`
	ShopName           string    `json:"shop_name"`
	Address            string    `json:"address"`
	Latitude           float64   `json:"latitude"`
	Longitude          float64   `json:"longitude"`
	Phone              string    `json:"phone"`
	Email              string    `json:"email"`
	BusinessHoursOpen  string    `json:"business_hours_open"`
	BusinessHoursClose string    `json:"business_hours_close"`
	Category           string    `json:"category"`
	Description        string    `json:"description"`
	CreatedAt          time.Time `json:"created_at"`
}
