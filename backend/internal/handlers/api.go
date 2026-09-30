// Package handlers exposes the calculator operations as a JSON HTTP API.
package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"math"
	"net/http"

	"github.com/jdgutirod/calculuzz/internal/calculator"
)

// CalcRequest holds the two validated operands of a calculator request.
type CalcRequest struct {
	A float64
	B float64
}

// requestBody is the raw JSON body sent to the calculator endpoints.
// Its fields are pointers so a missing field can be told apart from 0.
type requestBody struct {
	A *float64 `json:"a"`
	B *float64 `json:"b"`
}

type resultResponse struct {
	Result float64 `json:"result"`
}

type errorResponse struct {
	Error string `json:"error"`
}

var (
	// errMissingOperands is returned when a or b is absent or null.
	errMissingOperands = errors.New("fields a and b are required")

	// errMissingOperandA is returned when a is absent or null in a single-operand request.
	errMissingOperandA = errors.New("field a is required")

	// errTrailingData is returned when the body has content after the JSON object.
	errTrailingData = errors.New("unexpected data after JSON object")

	// errNonFiniteResult is returned when a result is NaN or ±Inf,
	// which JSON cannot represent.
	errNonFiniteResult = errors.New("result is too large or undefined")
)

// decodeCalcRequest parses a body that must contain both a and b.
func decodeCalcRequest(r *http.Request) (CalcRequest, error) {
	body, err := decodeBody(r)
	if err != nil {
		return CalcRequest{}, err
	}

	if body.A == nil || body.B == nil {
		return CalcRequest{}, errMissingOperands
	}

	return CalcRequest{A: *body.A, B: *body.B}, nil
}

// decodeSqrtRequest parses a body that must contain a. Any b is ignored.
func decodeSqrtRequest(r *http.Request) (float64, error) {
	body, err := decodeBody(r)
	if err != nil {
		return 0, err
	}

	if body.A == nil {
		return 0, errMissingOperandA
	}

	return *body.A, nil
}

// decodeBody parses the JSON body of r, rejecting unknown fields and
// anything after the JSON object.
func decodeBody(r *http.Request) (requestBody, error) {
	var body requestBody

	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	if err := dec.Decode(&body); err != nil {
		return requestBody{}, err
	}

	if _, err := dec.Token(); !errors.Is(err, io.EOF) {
		return requestBody{}, errTrailingData
	}

	return body, nil
}

// writeDecodeError responds to a request whose body could not be decoded,
// choosing the status and message from err.
func writeDecodeError(w http.ResponseWriter, err error) {
	var tooLarge *http.MaxBytesError

	switch {
	case errors.As(err, &tooLarge):
		writeJSON(w, http.StatusRequestEntityTooLarge, errorResponse{Error: "request body is too large"})
	case errors.Is(err, errMissingOperands), errors.Is(err, errMissingOperandA):
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: err.Error()})
	default:
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "invalid JSON body"})
	}
}

// validateResult returns errNonFiniteResult if result is NaN or ±Inf.
func validateResult(result float64) error {
	if math.IsNaN(result) || math.IsInf(result, 0) {
		return errNonFiniteResult
	}

	return nil
}

// writeJSON sets the JSON content type, writes status and encodes v as the body.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("encoding response: %v", err)
	}
}

// AddHandler responds with A plus B.
func AddHandler(w http.ResponseWriter, r *http.Request) {
	req, err := decodeCalcRequest(r)
	if err != nil {
		writeDecodeError(w, err)
		return
	}

	result := calculator.Add(req.A, req.B)
	if err := validateResult(result); err != nil {
		writeJSON(w, http.StatusUnprocessableEntity, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, resultResponse{Result: result})
}

// SubtractHandler responds with A minus B.
func SubtractHandler(w http.ResponseWriter, r *http.Request) {
	req, err := decodeCalcRequest(r)
	if err != nil {
		writeDecodeError(w, err)
		return
	}

	result := calculator.Subtract(req.A, req.B)
	if err := validateResult(result); err != nil {
		writeJSON(w, http.StatusUnprocessableEntity, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, resultResponse{Result: result})
}

// MultiplyHandler responds with A times B.
func MultiplyHandler(w http.ResponseWriter, r *http.Request) {
	req, err := decodeCalcRequest(r)
	if err != nil {
		writeDecodeError(w, err)
		return
	}

	result := calculator.Multiply(req.A, req.B)
	if err := validateResult(result); err != nil {
		writeJSON(w, http.StatusUnprocessableEntity, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, resultResponse{Result: result})
}

// DivideHandler responds with A divided by B.
func DivideHandler(w http.ResponseWriter, r *http.Request) {
	req, err := decodeCalcRequest(r)
	if err != nil {
		writeDecodeError(w, err)
		return
	}

	result, err := calculator.Divide(req.A, req.B)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: err.Error()})
		return
	}

	if err := validateResult(result); err != nil {
		writeJSON(w, http.StatusUnprocessableEntity, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, resultResponse{Result: result})
}

// PowHandler responds with A raised to the power of B.
func PowHandler(w http.ResponseWriter, r *http.Request) {
	req, err := decodeCalcRequest(r)
	if err != nil {
		writeDecodeError(w, err)
		return
	}

	result := calculator.Pow(req.A, req.B)
	if err := validateResult(result); err != nil {
		writeJSON(w, http.StatusUnprocessableEntity, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, resultResponse{Result: result})
}

// SqrtHandler responds with the square root of A.
func SqrtHandler(w http.ResponseWriter, r *http.Request) {
	a, err := decodeSqrtRequest(r)
	if err != nil {
		writeDecodeError(w, err)
		return
	}

	result, err := calculator.Sqrt(a)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, resultResponse{Result: result})
}

// PercentHandler responds with B percent of A.
func PercentHandler(w http.ResponseWriter, r *http.Request) {
	req, err := decodeCalcRequest(r)
	if err != nil {
		writeDecodeError(w, err)
		return
	}

	result := calculator.Percent(req.A, req.B)
	if err := validateResult(result); err != nil {
		writeJSON(w, http.StatusUnprocessableEntity, errorResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, resultResponse{Result: result})
}
