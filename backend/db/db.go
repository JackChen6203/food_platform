package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

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

	// Migration for existing tables (Rough way for prototype)
	// We ignore errors here as it might fail if column exists
	DB.Exec(`ALTER TABLE products ADD COLUMN IF NOT EXISTS merchant_id TEXT DEFAULT 'default_merchant';`)
	DB.Exec(`ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'AVAILABLE';`)
}
