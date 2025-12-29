package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() {
	var err error
	// Defaults for local development. Use environment variables in production.
	connStr := "user=postgres password=postgres dbname=food_platform sslmode=disable"
	if os.Getenv("DATABASE_URL") != "" {
		connStr = os.Getenv("DATABASE_URL")
	}

	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}

	// =========================================================================
	// Connection Pool Settings for Cloud Run Scalability
	// =========================================================================
	// MaxOpenConns: Limit max connections to prevent overwhelming the DB
	// when Cloud Run scales to many instances
	DB.SetMaxOpenConns(10)

	// MaxIdleConns: Keep some connections warm for faster response
	DB.SetMaxIdleConns(5)

	// ConnMaxLifetime: Prevent stale connections (important for Cloud SQL)
	DB.SetConnMaxLifetime(5 * time.Minute)

	// ConnMaxIdleTime: Close idle connections after this duration
	DB.SetConnMaxIdleTime(1 * time.Minute)
	// =========================================================================

	err = DB.Ping()
	if err != nil {
		log.Fatal("Cannot connect to database:", err)
	}

	fmt.Println("Successfully connected to the database!")

	createTables()
}

func createTables() {
	// Products Table
	queryProducts := `
	CREATE TABLE IF NOT EXISTS products (
		id SERIAL PRIMARY KEY,
		merchant_id TEXT DEFAULT 'default_merchant',
		name TEXT NOT NULL,
		original_price NUMERIC(10, 2) NOT NULL,
		current_price NUMERIC(10, 2) NOT NULL,
		expiry_date TIMESTAMP NOT NULL,
		latitude DOUBLE PRECISION NOT NULL,
		longitude DOUBLE PRECISION NOT NULL,
		is_listed BOOLEAN DEFAULT FALSE,
		status TEXT DEFAULT 'AVAILABLE',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err := DB.Exec(queryProducts)
	if err != nil {
		log.Fatal("Error creating products table:", err)
	}

	// Orders Table
	queryOrders := `
	CREATE TABLE IF NOT EXISTS orders (
		id SERIAL PRIMARY KEY,
		product_id INT REFERENCES products(id),
		consumer_id TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = DB.Exec(queryOrders)
	if err != nil {
		log.Fatal("Error creating orders table:", err)
	}

	// Users Table
	queryUsers := `
	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		email TEXT,
		auth_provider TEXT NOT NULL,
		auth_id TEXT NOT NULL,
		wallet_address TEXT,
		is_merchant BOOLEAN DEFAULT FALSE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(auth_provider, auth_id)
	);
	`
	_, err = DB.Exec(queryUsers)
	if err != nil {
		log.Fatal("Error creating users table:", err)
	}

	// Merchants Table
	queryMerchants := `
	CREATE TABLE IF NOT EXISTS merchants (
		user_id TEXT PRIMARY KEY REFERENCES users(id),
		shop_name TEXT,
		address TEXT,
		latitude DOUBLE PRECISION,
		longitude DOUBLE PRECISION,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = DB.Exec(queryMerchants)
	if err != nil {
		log.Fatal("Error creating merchants table:", err)
	}

	// Migration for existing tables (Rough way for prototype)
	// We ignore errors here as it might fail if column exists
	DB.Exec(`ALTER TABLE products ADD COLUMN IF NOT EXISTS merchant_id TEXT DEFAULT 'default_merchant';`)
	DB.Exec(`ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'AVAILABLE';`)

	// New merchant profile columns
	DB.Exec(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS phone TEXT;`)
	DB.Exec(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS email TEXT;`)
	DB.Exec(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS business_hours_open TEXT;`)
	DB.Exec(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS business_hours_close TEXT;`)
	DB.Exec(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS category TEXT;`)
	DB.Exec(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS description TEXT;`)

	// =========================================================================
	// NEW TABLES: Reviews, Favorites, Notifications
	// =========================================================================

	// Reviews Table - Consumer ratings for merchants
	queryReviews := `
	CREATE TABLE IF NOT EXISTS reviews (
		id SERIAL PRIMARY KEY,
		order_id INT REFERENCES orders(id),
		user_id TEXT REFERENCES users(id),
		merchant_id TEXT REFERENCES merchants(user_id),
		rating INT CHECK (rating >= 1 AND rating <= 5),
		comment TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`
	DB.Exec(queryReviews)

	// Favorites Table - Users' favorite merchants
	queryFavorites := `
	CREATE TABLE IF NOT EXISTS favorites (
		id SERIAL PRIMARY KEY,
		user_id TEXT REFERENCES users(id),
		merchant_id TEXT REFERENCES merchants(user_id),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(user_id, merchant_id)
	);
	`
	DB.Exec(queryFavorites)

	// Notifications Table - Push notifications
	queryNotifications := `
	CREATE TABLE IF NOT EXISTS notifications (
		id SERIAL PRIMARY KEY,
		user_id TEXT REFERENCES users(id),
		title TEXT NOT NULL,
		body TEXT,
		type TEXT DEFAULT 'general',
		is_read BOOLEAN DEFAULT FALSE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`
	DB.Exec(queryNotifications)

	// Pickup Schedules Table - Order pickup time slots
	queryPickupSchedules := `
	CREATE TABLE IF NOT EXISTS pickup_schedules (
		id SERIAL PRIMARY KEY,
		order_id INT REFERENCES orders(id),
		scheduled_time TIMESTAMP NOT NULL,
		status TEXT DEFAULT 'pending',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`
	DB.Exec(queryPickupSchedules)

	// Promotions Table - Merchant promotions
	queryPromotions := `
	CREATE TABLE IF NOT EXISTS promotions (
		id SERIAL PRIMARY KEY,
		merchant_id TEXT REFERENCES merchants(user_id),
		title TEXT NOT NULL,
		description TEXT,
		discount_percent INT,
		start_date TIMESTAMP,
		end_date TIMESTAMP,
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`
	DB.Exec(queryPromotions)

	// User Points Table - Loyalty points
	queryUserPoints := `
	CREATE TABLE IF NOT EXISTS user_points (
		user_id TEXT PRIMARY KEY REFERENCES users(id),
		points INT DEFAULT 0,
		last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`
	DB.Exec(queryUserPoints)

	// Point History Table - Points transactions
	queryPointHistory := `
	CREATE TABLE IF NOT EXISTS point_history (
		id SERIAL PRIMARY KEY,
		user_id TEXT REFERENCES users(id),
		points_change INT NOT NULL,
		reason TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`
	DB.Exec(queryPointHistory)

	// Add image_url column to products
	DB.Exec(`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;`)

	// Add status column to orders
	DB.Exec(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';`)
}
