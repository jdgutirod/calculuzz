import { KEYPAD, type KeyAction } from './keys'

interface KeypadProps {
  onPress: (action: KeyAction) => void
}

/** Grid of calculator buttons. */
export function Keypad({ onPress }: KeypadProps) {
  return (
    <div className="keypad">
      {KEYPAD.map((key) => {
        const className = ['key', `key--${key.variant}`, key.wide && 'key--wide']
          .filter(Boolean)
          .join(' ')

        return (
          <button
            key={key.label}
            type="button"
            className={className}
            aria-label={key.ariaLabel}
            onClick={() => onPress(key.action)}
          >
            {key.label}
          </button>
        )
      })}
    </div>
  )
}
