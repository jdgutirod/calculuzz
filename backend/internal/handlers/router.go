package handlers

import "net/http"

// NewRouter returns the API's HTTP handler with every route registered.
// Browser requests are allowed only from allowedOrigin (CORS).
func NewRouter(allowedOrigin string) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", HealthHandler)
	mux.HandleFunc("POST /add", AddHandler)
	mux.HandleFunc("POST /subtract", SubtractHandler)
	mux.HandleFunc("POST /multiply", MultiplyHandler)
	mux.HandleFunc("POST /divide", DivideHandler)
	mux.HandleFunc("POST /pow", PowHandler)
	mux.HandleFunc("POST /sqrt", SqrtHandler)
	mux.HandleFunc("POST /percent", PercentHandler)

	return withCORS(allowedOrigin, withBodyLimit(mux))
}

// HealthHandler reports that the server is up.
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "message": "API healthy"})
}
