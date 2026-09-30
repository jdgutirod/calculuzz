import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { calculate } from '../api/calculator'
import { Calculator } from './Calculator'

// The UI is tested on its own: calculate() is replaced by a mock each test controls.
vi.mock('../api/calculator', () => ({ calculate: vi.fn() }))
const mockedCalculate = vi.mocked(calculate)

function setup() {
  const user = userEvent.setup()
  render(<Calculator />)

  /** Clicks the buttons with the given accessible names, in order. */
  async function press(...names: string[]) {
    for (const name of names) {
      await user.click(screen.getByRole('button', { name }))
    }
  }

  return { user, press }
}

const currentValue = () => screen.getByLabelText('Current value').textContent
const expression = () => screen.getByLabelText('Expression').textContent

beforeEach(() => {
  mockedCalculate.mockReset()
})

describe('Calculator', () => {
  it('shows the digits being typed', async () => {
    const { press } = setup()

    await press('1', '2', 'decimal point', '5')

    expect(currentValue()).toBe('12.5')
  })

  it('shows the pending expression after choosing an operation', async () => {
    const { press } = setup()

    await press('5', 'add')

    expect(expression()).toBe('5 +')
  })

  it('asks the API for the result and shows it', async () => {
    mockedCalculate.mockResolvedValue(8)
    const { press } = setup()

    await press('5', 'add', '3', 'equals')

    expect(mockedCalculate).toHaveBeenCalledWith('add', 5, 3)
    await waitFor(() => expect(currentValue()).toBe('8'))
    expect(expression()).toBe('')
  })

  it('solves the previous operation when operations are chained', async () => {
    mockedCalculate.mockResolvedValue(5)
    const { press } = setup()

    await press('2', 'add', '3', 'multiply')

    expect(mockedCalculate).toHaveBeenCalledWith('add', 2, 3)
    await waitFor(() => expect(expression()).toBe('5 ×'))
  })

  it('calculates a square root with a single operand', async () => {
    mockedCalculate.mockResolvedValue(3)
    const { press } = setup()

    await press('9', 'square root')

    expect(mockedCalculate).toHaveBeenCalledWith('sqrt', 9, undefined)
    await waitFor(() => expect(currentValue()).toBe('3'))
  })

  it('does not call the API when the second operand is missing', async () => {
    const { press } = setup()

    await press('5', 'add', 'equals')

    expect(mockedCalculate).not.toHaveBeenCalled()
  })

  it('shows API errors and recovers on the next digit', async () => {
    mockedCalculate.mockRejectedValue(new Error('division by zero is not allowed'))
    const { press } = setup()

    await press('5', 'divide', '0', 'equals')

    expect(await screen.findByRole('alert')).toHaveTextContent('division by zero is not allowed')

    await press('7')

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(currentValue()).toBe('7')
  })

  it('ignores input while waiting for a result', async () => {
    mockedCalculate.mockReturnValue(new Promise(() => {})) // never resolves
    const { press } = setup()

    await press('5', 'add', '3', 'equals', '9')

    expect(currentValue()).toBe('3')
    expect(mockedCalculate).toHaveBeenCalledTimes(1)
  })

  it('works with the physical keyboard', async () => {
    mockedCalculate.mockResolvedValue(8)
    const { user } = setup()

    await user.keyboard('4*2{Enter}')

    expect(mockedCalculate).toHaveBeenCalledWith('multiply', 4, 2)
    await waitFor(() => expect(currentValue()).toBe('8'))
  })

  it('clears with Escape', async () => {
    const { user } = setup()

    await user.keyboard('123{Escape}')

    expect(currentValue()).toBe('0')
  })
})
