package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

const testOrigin = "http://localhost:5173"

// serve sends a request through the full router, middleware included.
func serve(method, path, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	rec := httptest.NewRecorder()

	NewRouter(testOrigin).ServeHTTP(rec, req)

	return rec
}

func TestRoutes(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		path       string
		body       string
		wantStatus int
	}{
		{"health", http.MethodGet, "/health", "", http.StatusOK},
		{"add", http.MethodPost, "/add", `{"a":1,"b":2}`, http.StatusOK},
		{"subtract", http.MethodPost, "/subtract", `{"a":1,"b":2}`, http.StatusOK},
		{"multiply", http.MethodPost, "/multiply", `{"a":1,"b":2}`, http.StatusOK},
		{"divide", http.MethodPost, "/divide", `{"a":1,"b":2}`, http.StatusOK},
		{"pow", http.MethodPost, "/pow", `{"a":1,"b":2}`, http.StatusOK},
		{"sqrt", http.MethodPost, "/sqrt", `{"a":4}`, http.StatusOK},
		{"percent", http.MethodPost, "/percent", `{"a":1,"b":2}`, http.StatusOK},
		{"wrong method", http.MethodGet, "/add", "", http.StatusMethodNotAllowed},
		{"unknown path", http.MethodPost, "/modulo", `{"a":1,"b":2}`, http.StatusNotFound},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			rec := serve(tc.method, tc.path, tc.body)

			if rec.Code != tc.wantStatus {
				t.Errorf("%s %s status = %d, want %d", tc.method, tc.path, rec.Code, tc.wantStatus)
			}
		})
	}
}

func TestCORS(t *testing.T) {
	t.Run("preflight", func(t *testing.T) {
		rec := serve(http.MethodOptions, "/add", "")

		if rec.Code != http.StatusNoContent {
			t.Errorf("status = %d, want %d", rec.Code, http.StatusNoContent)
		}
		if got := rec.Header().Get("Access-Control-Allow-Methods"); !strings.Contains(got, "POST") {
			t.Errorf("Access-Control-Allow-Methods = %q, want it to include POST", got)
		}
		if got := rec.Header().Get("Access-Control-Allow-Headers"); got != "Content-Type" {
			t.Errorf("Access-Control-Allow-Headers = %q, want %q", got, "Content-Type")
		}
	})

	t.Run("regular request", func(t *testing.T) {
		rec := serve(http.MethodPost, "/add", `{"a":1,"b":2}`)

		if got := rec.Header().Get("Access-Control-Allow-Origin"); got != testOrigin {
			t.Errorf("Access-Control-Allow-Origin = %q, want %q", got, testOrigin)
		}
	})
}

func TestBodyLimit(t *testing.T) {
	// A valid JSON object padded with spaces beyond the limit.
	body := `{"a":1,"b":2` + strings.Repeat(" ", maxBodyBytes) + `}`

	rec := serve(http.MethodPost, "/add", body)

	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusRequestEntityTooLarge)
	}
	if got, want := strings.TrimSpace(rec.Body.String()), `{"error":"request body is too large"}`; got != want {
		t.Errorf("body = %s, want %s", got, want)
	}
}
