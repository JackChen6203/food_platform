package models

import "time"

type Order struct {
	ID         int       `json:"id"`
	ProductID  int       `json:"product_id"`
	ConsumerID string    `json:"consumer_id"`
	CreatedAt  time.Time `json:"created_at"`
}
