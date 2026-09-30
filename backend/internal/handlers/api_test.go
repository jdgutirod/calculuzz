package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHandlers(t *testing.T) {
	tests := []struct {
		name       string
		handler    http.HandlerFunc
		body       string
		wantStatus int
		wantBody   string
	}{
		// Successful operations.
		{"add", AddHandler, `{"a":5,"b":3}`, http.StatusOK, `{"result":8}`},
		{"subtract", SubtractHandler, `{"a":5,"b":3}`, http.StatusOK, `{"result":2}`},
		{"multiply", MultiplyHandler, `{"a":4,"b":3}`, http.StatusOK, `{"result":12}`},
		{"divide", DivideHandler, `{"a":10,"b":4}`, http.StatusOK, `{"result":2.5}`},
		{"pow", PowHandler, `{"a":2,"b":10}`, http.StatusOK, `{"result":1024}`},
		{"sqrt ignores b", SqrtHandler, `{"a":9}`, http.StatusOK, `{"result":3}`},
		{"percent", PercentHandler, `{"a":200,"b":15}`, http.StatusOK, `{"result":30}`},

		// A zero result must still be sent (regression: it used to be omitted).
		{"zero result", SubtractHandler, `{"a":5,"b":5}`, http.StatusOK, `{"result":0}`},

		// Errors returned by the calculator.
		{"divide by zero", DivideHandler, `{"a":5,"b":0}`, http.StatusBadRequest,
			`{"error":"division by zero is not allowed"}`},
		{"sqrt of negative", SqrtHandler, `{"a":-4}`, http.StatusBadRequest,
			`{"error":"square root of a negative number is not allowed"}`},

		// Results JSON cannot represent (±Inf, NaN).
		{"pow overflow", PowHandler, `{"a":10,"b":400}`, http.StatusUnprocessableEntity,
			`{"error":"result is too large or undefined"}`},
		{"pow undefined", PowHandler, `{"a":-8,"b":0.5}`, http.StatusUnprocessableEntity,
			`{"error":"result is too large or undefined"}`},
		{"multiply overflow", MultiplyHandler, `{"a":1e308,"b":10}`, http.StatusUnprocessableEntity,
			`{"error":"result is too large or undefined"}`},

		// Invalid request bodies.
		{"malformed JSON", AddHandler, `{"a":5,`, http.StatusBadRequest, `{"error":"invalid JSON body"}`},
		{"empty body", AddHandler, ``, http.StatusBadRequest, `{"error":"invalid JSON body"}`},
		{"unknown field", AddHandler, `{"a":5,"c":1}`, http.StatusBadRequest, `{"error":"invalid JSON body"}`},
		{"string instead of number", AddHandler, `{"a":"5","b":3}`, http.StatusBadRequest, `{"error":"invalid JSON body"}`},
		{"data after JSON", AddHandler, `{"a":1,"b":2}extra`, http.StatusBadRequest, `{"error":"invalid JSON body"}`},
		{"two JSON objects", AddHandler, `{"a":1,"b":2}{"a":3,"b":4}`, http.StatusBadRequest, `{"error":"invalid JSON body"}`},

		// Missing operands (a missing field must not be treated as 0).
		{"missing b", AddHandler, `{"a":5}`, http.StatusBadRequest, `{"error":"fields a and b are required"}`},
		{"missing a", DivideHandler, `{"b":5}`, http.StatusBadRequest, `{"error":"fields a and b are required"}`},
		{"empty object", DivideHandler, `{}`, http.StatusBadRequest, `{"error":"fields a and b are required"}`},
		{"null operand", AddHandler, `{"a":5,"b":null}`, http.StatusBadRequest, `{"error":"fields a and b are required"}`},
		{"sqrt missing a", SqrtHandler, `{"b":9}`, http.StatusBadRequest, `{"error":"field a is required"}`},

		// Trailing whitespace is still valid JSON.
		{"trailing newline", AddHandler, "{\"a\":1,\"b\":2}\n", http.StatusOK, `{"result":3}`},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(tc.body))
			rec := httptest.NewRecorder()

			tc.handler(rec, req)

			if rec.Code != tc.wantStatus {
				t.Errorf("status = %d, want %d", rec.Code, tc.wantStatus)
			}
			if got := rec.Header().Get("Content-Type"); got != "application/json" {
				t.Errorf("Content-Type = %q, want %q", got, "application/json")
			}
			if got := strings.TrimSpace(rec.Body.String()); got != tc.wantBody {
				t.Errorf("body = %s, want %s", got, tc.wantBody)
			}
		})
	}
}
