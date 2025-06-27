package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	_ "github.com/lib/pq"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

type BadApp struct {
	db *sql.DB
	wg sync.WaitGroup
}

func main() {
	log.Println("Starting the bad PostgreSQL application...")

	// Get database configuration from environment variables
	dbHost := getEnv("DB_HOST", "postgres")
	dbPort := getEnvInt("DB_PORT", 5432)
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "mysecretpassword")
	dbName := getEnv("DB_NAME", "postgres")

	// Connect to PostgreSQL
	psqlInfo := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName)

	db, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Set connection pool to cause issues
	db.SetMaxOpenConns(50) // Too many connections
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(time.Minute * 5)

	app := &BadApp{db: db}

	// Initialize tables and data
	if err := app.initializeData(); err != nil {
		log.Fatal("Failed to initialize data:", err)
	}

	// Start Prometheus metrics endpoint
	go func() {
		http.Handle("/metrics", promhttp.Handler())
		log.Println("Prometheus metrics available at :8080/metrics")
		log.Fatal(http.ListenAndServe(":8080", nil))
	}()

	// Start various problematic operations
	log.Println("Starting problematic operations...")

	// 1. Long-running transactions
	go app.longRunningTransactions()

	// 2. Lock contention scenarios
	go app.lockContentionScenario()

	// 3. Inefficient queries
	go app.inefficientQueries()

	// 4. Connection pool exhaustion
	go app.connectionPoolExhaustion()

	// 5. Heavy write operations (vacuum stress)
	go app.heavyWriteOperations()

	// 6. Deadlock scenarios
	go app.deadlockScenarios()

	// 7. Slow queries with table scans
	go app.slowTableScans()

	// Keep the application running
	select {}
}

func (app *BadApp) initializeData() error {
	log.Println("Initializing database tables and data...")

	// Create tables
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			username VARCHAR(50) UNIQUE NOT NULL,
			email VARCHAR(100),
			balance DECIMAL(10,2) DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS orders (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id),
			amount DECIMAL(10,2),
			status VARCHAR(20) DEFAULT 'pending',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS audit_log (
			id SERIAL PRIMARY KEY,
			table_name VARCHAR(50),
			operation VARCHAR(10),
			record_id INTEGER,
			old_values JSONB,
			new_values JSONB,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS large_table (
			id SERIAL PRIMARY KEY,
			data TEXT,
			random_number INTEGER,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
	}

	for _, query := range queries {
		if _, err := app.db.Exec(query); err != nil {
			return fmt.Errorf("failed to execute query %s: %v", query, err)
		}
	}

	// Insert initial data
	log.Println("Inserting initial data...")
	for i := 1; i <= 1000; i++ {
		_, err := app.db.Exec(
			"INSERT INTO users (username, email, balance) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING",
			fmt.Sprintf("user%d", i),
			fmt.Sprintf("user%d@example.com", i),
			rand.Float64()*1000,
		)
		if err != nil {
			log.Printf("Error inserting user %d: %v", i, err)
		}
	}

	// Insert large table data
	for i := 1; i <= 10000; i++ {
		_, err := app.db.Exec(
			"INSERT INTO large_table (data, random_number) VALUES ($1, $2)",
			fmt.Sprintf("Large data entry %d with lots of text to make it bigger", i),
			rand.Intn(1000),
		)
		if err != nil {
			log.Printf("Error inserting large_table %d: %v", i, err)
		}
	}

	log.Println("Database initialization complete!")
	return nil
}

// 1. Long-running transactions that block other operations
func (app *BadApp) longRunningTransactions() {
	log.Println("Starting long-running transactions...")

	for {
		tx, err := app.db.Begin()
		if err != nil {
			log.Printf("Error starting transaction: %v", err)
			time.Sleep(5 * time.Second)
			continue
		}

		// Start a transaction and hold it for a long time
		_, err = tx.Exec("SELECT * FROM users WHERE id = $1 FOR UPDATE", rand.Intn(100)+1)
		if err != nil {
			log.Printf("Error in long transaction: %v", err)
			tx.Rollback()
			time.Sleep(5 * time.Second)
			continue
		}

		log.Println("Holding transaction for 30 seconds...")
		time.Sleep(30 * time.Second) // Hold the transaction for 30 seconds

		// Do some work while holding the lock
		for i := 0; i < 10; i++ {
			_, err = tx.Exec("UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", rand.Intn(100)+1)
			if err != nil {
				log.Printf("Error in long transaction update: %v", err)
				break
			}
			time.Sleep(2 * time.Second)
		}

		tx.Commit()
		log.Println("Long transaction completed")
		time.Sleep(10 * time.Second)
	}
}

// 2. Lock contention - multiple goroutines fighting for the same rows
func (app *BadApp) lockContentionScenario() {
	log.Println("Starting lock contention scenario...")

	for {
		var wg sync.WaitGroup

		// Start multiple goroutines that will compete for the same rows
		for i := 0; i < 10; i++ {
			wg.Add(1)
			go func(goroutineID int) {
				defer wg.Done()

				tx, err := app.db.Begin()
				if err != nil {
					log.Printf("Goroutine %d: Error starting transaction: %v", goroutineID, err)
					return
				}
				defer tx.Rollback()

				// All goroutines try to update the same few rows
				targetID := rand.Intn(10) + 1

				log.Printf("Goroutine %d: Attempting to lock user %d", goroutineID, targetID)

				_, err = tx.Exec("SELECT * FROM users WHERE id = $1 FOR UPDATE", targetID)
				if err != nil {
					log.Printf("Goroutine %d: Error selecting for update: %v", goroutineID, err)
					return
				}

				// Simulate some work
				time.Sleep(time.Duration(rand.Intn(10)+5) * time.Second)

				_, err = tx.Exec("UPDATE users SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
					rand.Float64()*100, targetID)
				if err != nil {
					log.Printf("Goroutine %d: Error updating: %v", goroutineID, err)
					return
				}

				tx.Commit()
				log.Printf("Goroutine %d: Successfully updated user %d", goroutineID, targetID)
			}(i)
		}

		wg.Wait()
		time.Sleep(15 * time.Second)
	}
}

// 3. Inefficient queries that cause high CPU usage
func (app *BadApp) inefficientQueries() {
	log.Println("Starting inefficient queries...")

	for {
		// Query without proper indexes
		rows, err := app.db.Query(`
			SELECT u.*, COUNT(o.id) as order_count 
			FROM users u 
			LEFT JOIN orders o ON u.id = o.user_id 
			WHERE u.email LIKE '%@example.com' 
			GROUP BY u.id 
			ORDER BY u.created_at DESC
		`)
		if err != nil {
			log.Printf("Error in inefficient query: %v", err)
		} else {
			// Process results slowly
			count := 0
			for rows.Next() {
				var id int
				var username, email string
				var balance float64
				var created_at, updated_at time.Time
				var order_count int

				err := rows.Scan(&id, &username, &email, &balance, &created_at, &updated_at, &order_count)
				if err != nil {
					log.Printf("Error scanning row: %v", err)
					continue
				}
				count++

				// Simulate slow processing
				time.Sleep(100 * time.Millisecond)
			}
			rows.Close()
			log.Printf("Processed %d rows from inefficient query", count)
		}

		// Another bad query - full table scan with function
		_, err = app.db.Query(`
			SELECT * FROM large_table 
			WHERE UPPER(data) LIKE '%ENTRY%' 
			AND random_number > 500
			ORDER BY created_at DESC
		`)
		if err != nil {
			log.Printf("Error in full table scan query: %v", err)
		}

		time.Sleep(20 * time.Second)
	}
}

// 4. Connection pool exhaustion
func (app *BadApp) connectionPoolExhaustion() {
	log.Println("Starting connection pool exhaustion...")

	for {
		var wg sync.WaitGroup

		// Create many concurrent connections
		for i := 0; i < 60; i++ { // More than our max pool size
			wg.Add(1)
			go func(connID int) {
				defer wg.Done()

				// Hold connection for a long time
				rows, err := app.db.Query("SELECT pg_sleep(15), * FROM users LIMIT 1")
				if err != nil {
					log.Printf("Connection %d: Error in query: %v", connID, err)
					return
				}
				defer rows.Close()

				for rows.Next() {
					// Just consume the result
				}

				log.Printf("Connection %d: Query completed", connID)
			}(i)
		}

		wg.Wait()
		time.Sleep(30 * time.Second)
	}
}

// 5. Heavy write operations to stress vacuum
func (app *BadApp) heavyWriteOperations() {
	log.Println("Starting heavy write operations...")

	for {
		// Bulk inserts
		for i := 0; i < 1000; i++ {
			_, err := app.db.Exec(`
				INSERT INTO audit_log (table_name, operation, record_id, old_values, new_values) 
				VALUES ($1, $2, $3, $4, $5)`,
				"users", "UPDATE", rand.Intn(1000)+1,
				fmt.Sprintf(`{"balance": %f}`, rand.Float64()*1000),
				fmt.Sprintf(`{"balance": %f}`, rand.Float64()*1000),
			)
			if err != nil {
				log.Printf("Error in bulk insert: %v", err)
			}
		}

		// Bulk updates
		for i := 0; i < 500; i++ {
			_, err := app.db.Exec(
				"UPDATE users SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
				rand.Float64()*1000, rand.Intn(1000)+1,
			)
			if err != nil {
				log.Printf("Error in bulk update: %v", err)
			}
		}

		// Bulk deletes and re-inserts (creates dead tuples)
		_, err := app.db.Exec("DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '1 minute'")
		if err != nil {
			log.Printf("Error in bulk delete: %v", err)
		}

		log.Println("Completed heavy write cycle")
		time.Sleep(10 * time.Second)
	}
}

// 6. Deadlock scenarios
func (app *BadApp) deadlockScenarios() {
	log.Println("Starting deadlock scenarios...")

	for {
		var wg sync.WaitGroup

		// Create potential deadlock with two transactions
		wg.Add(2)

		go func() {
			defer wg.Done()

			tx, err := app.db.Begin()
			if err != nil {
				log.Printf("Deadlock scenario 1: Error starting transaction: %v", err)
				return
			}
			defer tx.Rollback()

			// Lock user 1 first
			_, err = tx.Exec("UPDATE users SET balance = balance + 10 WHERE id = 1")
			if err != nil {
				log.Printf("Deadlock scenario 1: Error updating user 1: %v", err)
				return
			}

			time.Sleep(2 * time.Second)

			// Then try to lock user 2
			_, err = tx.Exec("UPDATE users SET balance = balance + 10 WHERE id = 2")
			if err != nil {
				log.Printf("Deadlock scenario 1: Error updating user 2: %v", err)
				return
			}

			tx.Commit()
			log.Println("Deadlock scenario 1: Transaction completed successfully")
		}()

		go func() {
			defer wg.Done()

			time.Sleep(500 * time.Millisecond) // Slight delay to increase deadlock chance

			tx, err := app.db.Begin()
			if err != nil {
				log.Printf("Deadlock scenario 2: Error starting transaction: %v", err)
				return
			}
			defer tx.Rollback()

			// Lock user 2 first
			_, err = tx.Exec("UPDATE users SET balance = balance + 10 WHERE id = 2")
			if err != nil {
				log.Printf("Deadlock scenario 2: Error updating user 2: %v", err)
				return
			}

			time.Sleep(2 * time.Second)

			// Then try to lock user 1
			_, err = tx.Exec("UPDATE users SET balance = balance + 10 WHERE id = 1")
			if err != nil {
				log.Printf("Deadlock scenario 2: Error updating user 1: %v", err)
				return
			}

			tx.Commit()
			log.Println("Deadlock scenario 2: Transaction completed successfully")
		}()

		wg.Wait()
		time.Sleep(30 * time.Second)
	}
}

// 7. Slow table scans
func (app *BadApp) slowTableScans() {
	log.Println("Starting slow table scans...")

	for {
		// Perform expensive aggregation without proper indexes
		ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)

		rows, err := app.db.QueryContext(ctx, `
			SELECT 
				DATE_TRUNC('hour', created_at) as hour,
				COUNT(*) as count,
				AVG(LENGTH(data)) as avg_length,
				MAX(random_number) as max_random
			FROM large_table 
			WHERE created_at > NOW() - INTERVAL '1 day'
			GROUP BY DATE_TRUNC('hour', created_at)
			ORDER BY hour DESC
		`)

		cancel()

		if err != nil {
			log.Printf("Error in slow table scan: %v", err)
		} else {
			count := 0
			for rows.Next() {
				var hour time.Time
				var rowCount int
				var avgLength float64
				var maxRandom int

				err := rows.Scan(&hour, &rowCount, &avgLength, &maxRandom)
				if err != nil {
					log.Printf("Error scanning aggregation row: %v", err)
					continue
				}
				count++
			}
			rows.Close()
			log.Printf("Completed slow aggregation query, processed %d result rows", count)
		}

		time.Sleep(25 * time.Second)
	}
}
