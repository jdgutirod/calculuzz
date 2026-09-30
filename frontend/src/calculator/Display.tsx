import { formatResult, type CalculatorState } from './calculatorReducer'
import { OPERATION_SYMBOLS } from './keys'

/**
 * Picks the font size for a value so it always fits the fixed-size screen.
 * Up to 9 characters use the full size; the longest values (about 18
 * characters, e.g. "-1.23456789012e+21") use the small one.
 */
function valueClassName(value: string): string {
  if (value.length > 13) return 'display__value display__value--small'
  if (value.length > 9) return 'display__value display__value--medium'
  return 'display__value'
}

interface DisplayProps {
  state: CalculatorState
}

/** Calculator screen: the pending expression above, the current value or an error below. */
export function Display({ state }: DisplayProps) {
  const { display, storedValue, pendingOperation, error, isCalculating } = state

  const expression =
    pendingOperation !== null && storedValue !== null
      ? `${formatResult(storedValue)} ${OPERATION_SYMBOLS[pendingOperation]}`
      : ''

  return (
    <div className={isCalculating ? 'display display--busy' : 'display'} aria-busy={isCalculating}>
      <p className="display__expression" aria-label="Expression">
        {expression}
      </p>

      {error ? (
        <p className="display__error" role="alert">
          {error}
        </p>
      ) : (
        <output className={valueClassName(display)} aria-label="Current value" aria-live="polite">
          {display}
        </output>
      )}
    </div>
  )
}
