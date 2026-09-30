import type { BinaryOperation } from '../api/calculator'

/** Most digits a typed number can have; more would lose float64 precision. */
export const MAX_DIGITS = 15

export interface CalculatorState {
  /** Number on screen: what the user is typing, or the last result. */
  display: string
  /** First operand of pendingOperation. */
  storedValue: number | null
  /** Operation waiting for its second operand, e.g. 'add' after pressing "+". */
  pendingOperation: BinaryOperation | null
  /** True right after choosing an operation, before its second operand exists. */
  waitingForOperand: boolean
  /** True when the next digit starts a new number instead of extending the display. */
  overwrite: boolean
  /** Message of the last failed calculation, shown instead of the display. */
  error: string | null
  /** True while a calculation request is in progress. */
  isCalculating: boolean
}

export type CalculatorAction =
  | { type: 'digit'; digit: string }
  | { type: 'decimalPoint' }
  | { type: 'toggleSign' }
  | { type: 'backspace' }
  | { type: 'clear' }
  | { type: 'operationChosen'; operation: BinaryOperation }
  | { type: 'calculationStarted' }
  | { type: 'resultReceived'; result: number; nextOperation: BinaryOperation | null }
  | { type: 'squareRootReceived'; result: number }
  | { type: 'calculationFailed'; message: string }

export const initialState: CalculatorState = {
  display: '0',
  storedValue: null,
  pendingOperation: null,
  waitingForOperand: false,
  overwrite: true,
  error: null,
  isCalculating: false,
}

export function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction,
): CalculatorState {
  switch (action.type) {
    case 'digit':
      return typeDigit(state, action.digit)
    case 'decimalPoint':
      return typeDecimalPoint(state)
    case 'toggleSign':
      return toggleSign(state)
    case 'backspace':
      return deleteLastCharacter(state)
    case 'clear':
      return initialState
    case 'operationChosen':
      return chooseOperation(state, action.operation)
    case 'calculationStarted':
      return { ...state, isCalculating: true }
    case 'resultReceived':
      return {
        ...state,
        display: formatResult(action.result),
        storedValue: action.nextOperation ? action.result : null,
        pendingOperation: action.nextOperation,
        waitingForOperand: action.nextOperation !== null,
        overwrite: true,
        isCalculating: false,
      }
    case 'squareRootReceived':
      // Any pending operation is kept: the root becomes its second operand.
      return {
        ...state,
        display: formatResult(action.result),
        waitingForOperand: false,
        overwrite: true,
        isCalculating: false,
      }
    case 'calculationFailed':
      return { ...initialState, error: action.message }
  }
}

/**
 * Formats a result for the screen, rounding away floating point noise
 * such as 0.1 + 0.2 = 0.30000000000000004.
 */
export function formatResult(value: number): string {
  return String(Number(value.toPrecision(12)))
}

function typeDigit(state: CalculatorState, digit: string): CalculatorState {
  if (state.error) {
    return typeDigit(initialState, digit)
  }

  if (state.overwrite) {
    return { ...state, display: digit, overwrite: false, waitingForOperand: false }
  }

  if (countDigits(state.display) >= MAX_DIGITS) {
    return state
  }

  const display = state.display === '0' ? digit : state.display + digit
  return { ...state, display }
}

function typeDecimalPoint(state: CalculatorState): CalculatorState {
  if (state.error) {
    return typeDecimalPoint(initialState)
  }

  if (state.overwrite) {
    return { ...state, display: '0.', overwrite: false, waitingForOperand: false }
  }

  if (state.display.includes('.')) {
    return state
  }

  return { ...state, display: state.display + '.' }
}

function toggleSign(state: CalculatorState): CalculatorState {
  if (state.error || state.waitingForOperand || Number(state.display) === 0) {
    return state
  }

  const display = state.display.startsWith('-')
    ? state.display.slice(1)
    : '-' + state.display

  return { ...state, display }
}

function deleteLastCharacter(state: CalculatorState): CalculatorState {
  if (state.error) {
    return initialState
  }

  // Results and chosen operands are not being typed, so they can't be edited.
  if (state.overwrite) {
    return state
  }

  const display = state.display.slice(0, -1)
  const isEmpty = display === '' || display === '-'

  return { ...state, display: isEmpty ? '0' : display }
}

function chooseOperation(
  state: CalculatorState,
  operation: BinaryOperation,
): CalculatorState {
  if (state.error) {
    return state
  }

  // Pressing another operator right away just changes one's mind.
  if (state.waitingForOperand) {
    return { ...state, pendingOperation: operation }
  }

  return {
    ...state,
    storedValue: Number(state.display),
    pendingOperation: operation,
    waitingForOperand: true,
    overwrite: true,
  }
}

function countDigits(display: string): number {
  return display.replace(/[-.]/g, '').length
}
