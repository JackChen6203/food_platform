package models

import "time"

type Review struct {
	ID         int       `json:"id"`
	OrderID    int       `json:"order_id"`
	UserID     string    `json:"user_id"`
	MerchantID string    `json:"merchant_id"`
	Rating     int       `json:"rating"`
	Comment    string    `json:"comment"`
	CreatedAt  time.Time `json:"created_at"`
}

type Favorite struct {
	ID         int       `json:"id"`
	UserID     string    `json:"user_id"`
	MerchantID string    `json:"merchant_id"`
	CreatedAt  time.Time `json:"created_at"`
}

type Notification struct {
	ID        int       `json:"id"`
	UserID    string    `json:"user_id"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	Type      string    `json:"type"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

type PickupSchedule struct {
	ID            int       `json:"id"`
	OrderID       int       `json:"order_id"`
	ScheduledTime time.Time `json:"scheduled_time"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

type Promotion struct {
	ID              int       `json:"id"`
	MerchantID      string    `json:"merchant_id"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	DiscountPercent int       `json:"discount_percent"`
	StartDate       time.Time `json:"start_date"`
	EndDate         time.Time `json:"end_date"`
	IsActive        bool      `json:"is_active"`
	CreatedAt       time.Time `json:"created_at"`
}

type UserPoints struct {
	UserID      string    `json:"user_id"`
	Points      int       `json:"points"`
	LastUpdated time.Time `json:"last_updated"`
}

type PointHistory struct {
	ID           int       `json:"id"`
	UserID       string    `json:"user_id"`
	PointsChange int       `json:"points_change"`
	Reason       string    `json:"reason"`
	CreatedAt    time.Time `json:"created_at"`
}
