import type { BinaryOperation } from '../api/calculator'

/** What pressing a key (on screen or on the keyboard) asks the calculator to do. */
export type KeyAction =
  | { type: 'digit'; digit: string }
  | { type: 'decimalPoint' }
  | { type: 'toggleSign' }
  | { type: 'backspace' }
  | { type: 'clear' }
  | { type: 'operation'; operation: BinaryOperation }
  | { type: 'sqrt' }
  | { type: 'equals' }

export interface KeyDefinition {
  label: string
  /** Name read by screen readers, when the label is a symbol. */
  ariaLabel?: string
  action: KeyAction
  variant: 'digit' | 'function' | 'operator' | 'equals'
  /** Spans three columns instead of one. */
  wide?: boolean
}

/** Symbol shown on screen for each operation. */
export const OPERATION_SYMBOLS: Record<BinaryOperation, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
  pow: '^',
  percent: '%',
}

const digit = (value: string): KeyDefinition => ({
  label: value,
  action: { type: 'digit', digit: value },
  variant: 'digit',
})

const operator = (operation: BinaryOperation, label: string, ariaLabel: string): KeyDefinition => ({
  label,
  ariaLabel,
  action: { type: 'operation', operation },
  variant: 'operator',
})

/** Keypad buttons in reading order, four per row. */
export const KEYPAD: KeyDefinition[] = [
  { label: 'C', ariaLabel: 'clear', action: { type: 'clear' }, variant: 'function' },
  { label: '⌫', ariaLabel: 'backspace', action: { type: 'backspace' }, variant: 'function' },
  { label: '√', ariaLabel: 'square root', action: { type: 'sqrt' }, variant: 'function' },
  operator('pow', 'xʸ', 'power'),

  digit('7'), digit('8'), digit('9'), operator('divide', '÷', 'divide'),
  digit('4'), digit('5'), digit('6'), operator('multiply', '×', 'multiply'),
  digit('1'), digit('2'), digit('3'), operator('subtract', '−', 'subtract'),

  { label: '±', ariaLabel: 'toggle sign', action: { type: 'toggleSign' }, variant: 'function' },
  digit('0'),
  { label: '.', ariaLabel: 'decimal point', action: { type: 'decimalPoint' }, variant: 'digit' },
  operator('add', '+', 'add'),

  operator('percent', '%', 'percent'),
  { label: '=', ariaLabel: 'equals', action: { type: 'equals' }, variant: 'equals', wide: true },
]

/** Maps a KeyboardEvent.key to its action, or null if the key isn't used. */
export function keyActionFromKeyboard(key: string): KeyAction | null {
  if (/^[0-9]$/.test(key)) {
    return { type: 'digit', digit: key }
  }

  switch (key) {
    case '.':
    case ',':
      return { type: 'decimalPoint' }
    case '+':
      return { type: 'operation', operation: 'add' }
    case '-':
      return { type: 'operation', operation: 'subtract' }
    case '*':
      return { type: 'operation', operation: 'multiply' }
    case '/':
      return { type: 'operation', operation: 'divide' }
    case '^':
      return { type: 'operation', operation: 'pow' }
    case '%':
      return { type: 'operation', operation: 'percent' }
    case 'Enter':
    case '=':
      return { type: 'equals' }
    case 'Backspace':
      return { type: 'backspace' }
    case 'Escape':
    case 'Delete':
      return { type: 'clear' }
    default:
      return null
  }
}
