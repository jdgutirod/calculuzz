// Command api starts the calculuzz HTTP server.
//
// Configuration comes from environment variables:
//
//	PORT            port to listen on (default 8080)
//	ALLOWED_ORIGIN  origin the frontend is served from (default http://localhost:5173)
package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jdgutirod/calculuzz/internal/handlers"
)

const (
	defaultPort          = "8080"
	defaultAllowedOrigin = "http://localhost:5173" // Vite's dev server
	readHeaderTimeout    = 5 * time.Second
	shutdownTimeout      = 10 * time.Second
)

func main() {
	port := envOrDefault("PORT", defaultPort)
	allowedOrigin := envOrDefault("ALLOWED_ORIGIN", defaultAllowedOrigin)

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           handlers.NewRouter(allowedOrigin),
		ReadHeaderTimeout: readHeaderTimeout,
	}

	// ctx is cancelled on Ctrl+C or when Docker stops the container (SIGTERM).
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Printf("server listening on :%s (allowed origin: %s)", port, allowedOrigin)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("starting server: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("shutting down server")

	// Give in-flight requests up to shutdownTimeout to finish.
	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("shutting down server: %v", err)
	}
}

// envOrDefault returns the value of the environment variable key,
// or fallback if it is unset or empty.
func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}
