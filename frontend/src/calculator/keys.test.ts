import { describe, expect, it } from 'vitest'
import { keyActionFromKeyboard } from './keys'

describe('keyActionFromKeyboard', () => {
  it.each([
    ['7', { type: 'digit', digit: '7' }],
    ['.', { type: 'decimalPoint' }],
    [',', { type: 'decimalPoint' }],
    ['+', { type: 'operation', operation: 'add' }],
    ['-', { type: 'operation', operation: 'subtract' }],
    ['*', { type: 'operation', operation: 'multiply' }],
    ['/', { type: 'operation', operation: 'divide' }],
    ['^', { type: 'operation', operation: 'pow' }],
    ['%', { type: 'operation', operation: 'percent' }],
    ['Enter', { type: 'equals' }],
    ['=', { type: 'equals' }],
    ['Backspace', { type: 'backspace' }],
    ['Escape', { type: 'clear' }],
    ['Delete', { type: 'clear' }],
  ])('maps %s', (key, expected) => {
    expect(keyActionFromKeyboard(key)).toEqual(expected)
  })

  it.each(['a', 'Tab', 'F5', '12'])('ignores %s', (key) => {
    expect(keyActionFromKeyboard(key)).toBeNull()
  })
})
