package handlers

import "net/http"

// maxBodyBytes is the largest request body accepted. A valid request is
// under 100 bytes, so 1 KiB leaves plenty of room.
const maxBodyBytes = 1 << 10

// withCORS lets a browser app served from allowedOrigin call the API.
// It answers preflight (OPTIONS) requests itself, so they never reach the
// router, which would reject them as method not allowed.
func withCORS(allowedOrigin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)

		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// withBodyLimit makes reading more than maxBodyBytes from the request body
// fail with an *http.MaxBytesError.
func withBodyLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
		next.ServeHTTP(w, r)
	})
}
