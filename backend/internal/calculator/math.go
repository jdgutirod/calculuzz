package calculator

import (
	"errors"
	"math"
)

var ErrDivisionByZero = errors.New("division by zero is not allowed")
var ErrNegativeSqrt = errors.New("square root of a negative number is not allowed")

// Add returns a + b.
func Add(a, b float64) float64 {
	return a + b
}

// Subtract returns a - b.
func Subtract(a, b float64) float64 {
	return a - b
}

// Multiply returns a * b.
func Multiply(a, b float64) float64 {
	return a * b
}

// Divide returns a / b, or ErrDivisionByZero if b is 0.
func Divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, ErrDivisionByZero
	}

	return a / b, nil
}

// Pow returns a raised to the power of b.
func Pow(a, b float64) float64 {
	return math.Pow(a, b)
}

// Sqrt returns the square root of a, or ErrNegativeSqrt if a is negative.
func Sqrt(a float64) (float64, error) {
	if a < 0 {
		return 0, ErrNegativeSqrt
	}
	return math.Sqrt(a), nil
}

// Percent returns b percent of a. For example, Percent(200, 15) returns 30.
func Percent(a, b float64) float64 {
	return a * (b / 100)
}
