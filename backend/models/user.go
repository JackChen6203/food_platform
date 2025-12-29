package models

import "time"

type User struct {
	ID            string    `json:"id"` // UUID
	Email         string    `json:"email"`
	Phone         string    `json:"phone,omitempty"`
	PhoneVerified bool      `json:"phone_verified"`
	AuthProvider  string    `json:"auth_provider"` // "google", "facebook", "line", "x", "crypto", "phone"
	AuthID        string    `json:"auth_id"`       // Provider's User ID or Wallet Address
	WalletAddress string    `json:"wallet_address,omitempty"`
	IsMerchant    bool      `json:"is_merchant"`
	CreatedAt     time.Time `json:"created_at"`
}
