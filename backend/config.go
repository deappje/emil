package main

import "os"

// Config is read from the environment once at startup.
type Config struct {
	Port        string
	DatabaseURL string
	StaticDir   string
	// Cookies are Secure (and SameSite=None, so login also works inside the
	// Basable editor's iframe) unless COOKIE_INSECURE=1 for local http.
	SecureCookies bool
	// Public bucket for plant photos; photos are disabled when empty.
	PublicBucket string
	PublicURL    string
}

func loadConfig() Config {
	return Config{
		Port:          env("PORT", "8080"),
		DatabaseURL:   env("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/plantengids?sslmode=disable"),
		StaticDir:     env("STATIC_DIR", "./static"),
		SecureCookies: os.Getenv("COOKIE_INSECURE") != "1",
		PublicBucket:  os.Getenv("S3_PUBLIC_BUCKET"),
		PublicURL:     os.Getenv("S3_PUBLIC_URL"),
	}
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
