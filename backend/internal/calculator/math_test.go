package calculator

import (
	"errors"
	"math"
	"testing"
)

// tolerance is the maximum difference accepted when comparing float results,
// since operations like 0.1 + 0.2 are not exact in floating point.
const tolerance = 1e-9

// binaryCase is a test case for an operation that takes two numbers and cannot fail.
type binaryCase struct {
	name string
	a, b float64
	want float64
}

// runBinaryCases checks op against every case, naming it opName in failure messages.
func runBinaryCases(t *testing.T, opName string, op func(a, b float64) float64, cases []binaryCase) {
	t.Helper()

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := op(tc.a, tc.b)
			if math.Abs(got-tc.want) > tolerance {
				t.Errorf("%s(%v, %v) = %v, want %v", opName, tc.a, tc.b, got, tc.want)
			}
		})
	}
}

func TestAdd(t *testing.T) {
	runBinaryCases(t, "Add", Add, []binaryCase{
		{name: "positives", a: 5, b: 3, want: 8},
		{name: "negatives", a: -5, b: -3, want: -8},
		{name: "mixed signs", a: -5, b: 3, want: -2},
		{name: "decimals", a: 0.1, b: 0.2, want: 0.3},
		{name: "zeros", a: 0, b: 0, want: 0},
	})
}

func TestSubtract(t *testing.T) {
	runBinaryCases(t, "Subtract", Subtract, []binaryCase{
		{name: "positive result", a: 5, b: 3, want: 2},
		{name: "negative result", a: 3, b: 5, want: -2},
		{name: "same numbers", a: 5, b: 5, want: 0},
		{name: "subtract negative", a: 5, b: -3, want: 8},
	})
}

func TestMultiply(t *testing.T) {
	runBinaryCases(t, "Multiply", Multiply, []binaryCase{
		{name: "positives", a: 4, b: 3, want: 12},
		{name: "mixed signs", a: -4, b: 3, want: -12},
		{name: "negatives", a: -4, b: -3, want: 12},
		{name: "by zero", a: 4, b: 0, want: 0},
		{name: "decimals", a: 0.5, b: 0.5, want: 0.25},
	})
}

func TestPow(t *testing.T) {
	runBinaryCases(t, "Pow", Pow, []binaryCase{
		{name: "positive exponent", a: 2, b: 10, want: 1024},
		{name: "zero exponent", a: 7, b: 0, want: 1},
		{name: "negative exponent", a: 2, b: -1, want: 0.5},
		{name: "fractional exponent", a: 9, b: 0.5, want: 3},
		{name: "negative base", a: -2, b: 3, want: -8},
	})
}

func TestPercent(t *testing.T) {
	runBinaryCases(t, "Percent", Percent, []binaryCase{
		{name: "15 percent of 200", a: 200, b: 15, want: 30},
		{name: "200 percent of 50", a: 50, b: 200, want: 100},
		{name: "0 percent", a: 80, b: 0, want: 0},
		{name: "percent of negative", a: -200, b: 10, want: -20},
	})
}

func TestDivide(t *testing.T) {
	tests := []struct {
		name    string
		a, b    float64
		want    float64
		wantErr error
	}{
		{name: "exact", a: 10, b: 2, want: 5},
		{name: "decimal result", a: 1, b: 4, want: 0.25},
		{name: "negative divisor", a: 10, b: -2, want: -5},
		{name: "zero dividend", a: 0, b: 5, want: 0},
		{name: "by zero", a: 10, b: 0, wantErr: ErrDivisionByZero},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, err := Divide(tc.a, tc.b)
			if !errors.Is(err, tc.wantErr) {
				t.Fatalf("Divide(%v, %v) error = %v, want %v", tc.a, tc.b, err, tc.wantErr)
			}
			if math.Abs(got-tc.want) > tolerance {
				t.Errorf("Divide(%v, %v) = %v, want %v", tc.a, tc.b, got, tc.want)
			}
		})
	}
}

func TestSqrt(t *testing.T) {
	tests := []struct {
		name    string
		a       float64
		want    float64
		wantErr error
	}{
		{name: "perfect square", a: 9, want: 3},
		{name: "non perfect square", a: 2, want: math.Sqrt2},
		{name: "zero", a: 0, want: 0},
		{name: "negative", a: -4, wantErr: ErrNegativeSqrt},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, err := Sqrt(tc.a)
			if !errors.Is(err, tc.wantErr) {
				t.Fatalf("Sqrt(%v) error = %v, want %v", tc.a, err, tc.wantErr)
			}
			if math.Abs(got-tc.want) > tolerance {
				t.Errorf("Sqrt(%v) = %v, want %v", tc.a, got, tc.want)
			}
		})
	}
}
