import { useEffect } from 'react'
import './Calculator.css'
import { Display } from './Display'
import { Keypad } from './Keypad'
import { keyActionFromKeyboard } from './keys'
import { useCalculator } from './useCalculator'

/** Calculator usable with the on-screen keypad or the physical keyboard. */
export function Calculator() {
  const { state, press } = useCalculator()

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Leave browser shortcuts like Ctrl+R alone.
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      const action = keyActionFromKeyboard(event.key)
      if (!action) {
        return
      }

      // Stops Enter from also clicking a focused button, and "/" from opening Firefox's search.
      event.preventDefault()
      press(action)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [press])

  return (
    <section className="calculator" aria-label="Calculator">
      <Display state={state} />
      <Keypad onPress={press} />
    </section>
  )
}
