import { useReducer } from 'react'
import { calculate, type Operation } from '../api/calculator'
import {
  calculatorReducer,
  initialState,
  type CalculatorAction,
} from './calculatorReducer'
import type { KeyAction } from './keys'

/**
 * Holds the calculator state and turns key presses into state changes,
 * calling the API when an operation has to be solved.
 */
export function useCalculator() {
  const [state, dispatch] = useReducer(calculatorReducer, initialState)

  /** Sends one calculation to the API and stores its result, or its error. */
  async function runCalculation(
    operation: Operation,
    a: number,
    b: number | undefined,
    toAction: (result: number) => CalculatorAction,
  ) {
    dispatch({ type: 'calculationStarted' })

    try {
      const result = await calculate(operation, a, b)
      dispatch(toAction(result))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'something went wrong'
      dispatch({ type: 'calculationFailed', message })
    }
  }

  function press(key: KeyAction) {
    // Ignore input until the current result arrives.
    if (state.isCalculating) {
      return
    }

    const { pendingOperation, storedValue } = state
    const current = Number(state.display)
    const hasBothOperands =
      pendingOperation !== null && storedValue !== null && !state.waitingForOperand

    switch (key.type) {
      case 'operation': {
        const nextOperation = key.operation

        if (hasBothOperands) {
          // Chained input like "2 + 3 ×": solve "2 + 3" first, then wait for ×'s operand.
          void runCalculation(pendingOperation, storedValue, current, (result) => ({
            type: 'resultReceived',
            result,
            nextOperation,
          }))
        } else {
          dispatch({ type: 'operationChosen', operation: nextOperation })
        }
        return
      }

      case 'equals':
        if (hasBothOperands) {
          void runCalculation(pendingOperation, storedValue, current, (result) => ({
            type: 'resultReceived',
            result,
            nextOperation: null,
          }))
        }
        return

      case 'sqrt':
        if (!state.error) {
          void runCalculation('sqrt', current, undefined, (result) => ({
            type: 'squareRootReceived',
            result,
          }))
        }
        return

      default:
        // Typing keys (digits, point, sign, backspace, clear) only change local state.
        dispatch(key)
    }
  }

  return { state, press }
}
