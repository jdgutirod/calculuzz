import { describe, expect, it } from 'vitest'
import {
  MAX_DIGITS,
  calculatorReducer,
  formatResult,
  initialState,
  type CalculatorAction,
  type CalculatorState,
} from './calculatorReducer'

/** Applies actions in order, starting from state. */
function apply(state: CalculatorState, ...actions: CalculatorAction[]): CalculatorState {
  return actions.reduce(calculatorReducer, state)
}

const digit = (d: string): CalculatorAction => ({ type: 'digit', digit: d })

describe('typing numbers', () => {
  it('replaces the initial 0 with the first digit', () => {
    expect(apply(initialState, digit('7')).display).toBe('7')
  })

  it('appends digits', () => {
    expect(apply(initialState, digit('1'), digit('2'), digit('3')).display).toBe('123')
  })

  it('does not stack leading zeros', () => {
    expect(apply(initialState, digit('0'), digit('0'), digit('5')).display).toBe('5')
  })

  it('accepts a single decimal point', () => {
    const state = apply(initialState, digit('1'), { type: 'decimalPoint' }, digit('5'), { type: 'decimalPoint' })
    expect(state.display).toBe('1.5')
  })

  it('starts with "0." when the point is typed first', () => {
    expect(apply(initialState, { type: 'decimalPoint' }).display).toBe('0.')
  })

  it(`stops at ${MAX_DIGITS} digits`, () => {
    const digits = Array.from({ length: MAX_DIGITS + 3 }, () => digit('9'))
    expect(apply(initialState, ...digits).display).toBe('9'.repeat(MAX_DIGITS))
  })
})

describe('editing', () => {
  it('toggles the sign', () => {
    expect(apply(initialState, digit('4'), { type: 'toggleSign' }).display).toBe('-4')
    expect(apply(initialState, digit('4'), { type: 'toggleSign' }, { type: 'toggleSign' }).display).toBe('4')
  })

  it('does not make zero negative', () => {
    expect(apply(initialState, { type: 'toggleSign' }).display).toBe('0')
  })

  it('deletes the last character, down to 0', () => {
    expect(apply(initialState, digit('1'), digit('2'), { type: 'backspace' }).display).toBe('1')
    expect(apply(initialState, digit('1'), { type: 'backspace' }).display).toBe('0')
    expect(apply(initialState, digit('1'), { type: 'toggleSign' }, { type: 'backspace' }).display).toBe('0')
  })

  it('does not edit a result', () => {
    const state = apply(initialState, { type: 'resultReceived', result: 42, nextOperation: null }, { type: 'backspace' })
    expect(state.display).toBe('42')
  })

  it('clears everything', () => {
    const state = apply(initialState, digit('5'), { type: 'operationChosen', operation: 'add' }, { type: 'clear' })
    expect(state).toEqual(initialState)
  })
})

describe('operations', () => {
  it('stores the first operand and waits for the second', () => {
    const state = apply(initialState, digit('5'), { type: 'operationChosen', operation: 'add' })

    expect(state).toMatchObject({
      storedValue: 5,
      pendingOperation: 'add',
      waitingForOperand: true,
      display: '5',
    })
  })

  it('starts the second operand on the next digit', () => {
    const state = apply(initialState, digit('5'), { type: 'operationChosen', operation: 'add' }, digit('3'))

    expect(state.display).toBe('3')
    expect(state.waitingForOperand).toBe(false)
  })

  it('changes the operation when another operator follows right away', () => {
    const state = apply(
      initialState,
      digit('5'),
      { type: 'operationChosen', operation: 'add' },
      { type: 'operationChosen', operation: 'multiply' },
    )

    expect(state.pendingOperation).toBe('multiply')
    expect(state.storedValue).toBe(5)
  })
})

describe('results', () => {
  it('shows the result and clears the pending operation', () => {
    const state = apply(initialState, { type: 'calculationStarted' }, { type: 'resultReceived', result: 8, nextOperation: null })

    expect(state).toMatchObject({ display: '8', pendingOperation: null, isCalculating: false })
  })

  it('keeps chaining when a next operation is given', () => {
    const state = apply(initialState, { type: 'resultReceived', result: 5, nextOperation: 'multiply' })

    expect(state).toMatchObject({ display: '5', storedValue: 5, pendingOperation: 'multiply', waitingForOperand: true })
  })

  it('uses a square root as the second operand of a pending operation', () => {
    const state = apply(
      initialState,
      digit('9'),
      { type: 'operationChosen', operation: 'add' },
      digit('1'),
      digit('6'),
      { type: 'squareRootReceived', result: 4 },
    )

    expect(state).toMatchObject({ display: '4', storedValue: 9, pendingOperation: 'add', waitingForOperand: false })
  })

  it('starts a new number when typing after a result', () => {
    const state = apply(initialState, { type: 'resultReceived', result: 8, nextOperation: null }, digit('2'))
    expect(state.display).toBe('2')
  })
})

describe('errors', () => {
  const failed = apply(initialState, digit('5'), { type: 'calculationFailed', message: 'division by zero is not allowed' })

  it('shows the error and resets the calculation', () => {
    expect(failed).toMatchObject({ error: 'division by zero is not allowed', display: '0', pendingOperation: null })
  })

  it('starts over when a digit is typed', () => {
    expect(apply(failed, digit('7'))).toMatchObject({ error: null, display: '7' })
  })

  it('ignores operators until a new number is typed', () => {
    expect(apply(failed, { type: 'operationChosen', operation: 'add' })).toBe(failed)
  })
})

describe('formatResult', () => {
  it.each([
    [8, '8'],
    [2.5, '2.5'],
    [0.1 + 0.2, '0.3'],
    [-0, '0'],
    [1 / 3, '0.333333333333'],
    [1e21, '1e+21'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatResult(value)).toBe(expected)
  })
})
