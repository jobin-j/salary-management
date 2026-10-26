import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Employee } from '../api/employees'
import EmployeesPage from './EmployeesPage'

const priya: Employee = {
  id: 1,
  full_name: 'Priya Sharma',
  email: 'priya@example.com',
  job_title: 'Engineer',
  department: 'Engineering',
  country: 'IN',
  currency: 'INR',
  employment_type: 'full_time',
  annual_salary: 1500000,
  hire_date: '2022-04-01',
}

const options = {
  countries: [
    { code: 'IN', currency: 'INR' },
    { code: 'US', currency: 'USD' },
  ],
  departments: ['Engineering'],
  job_titles: ['Engineer'],
  employment_types: ['full_time', 'part_time', 'contract'],
}

let fetchMock: Mock<(input: string, init?: RequestInit) => Promise<Response>>

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

function stubApi() {
  fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input)
    if (url.pathname === '/options') return jsonResponse(options)
    if (init?.method === 'POST') return jsonResponse({ id: 2, currency: 'USD', ...JSON.parse(String(init.body)) }, 201)
    if (init?.method === 'PATCH') return jsonResponse({ ...priya, ...JSON.parse(String(init.body)) })
    if (init?.method === 'DELETE') return new Response(null, { status: 204 })
    return jsonResponse({ items: [priya], total: 100, page: 1, page_size: 20 })
  })
  vi.stubGlobal('fetch', fetchMock)
}

/** Keeps reads working but answers every write with an error response. */
function rejectWritesWith(status: number, body: unknown) {
  const respond = fetchMock.getMockImplementation()!
  fetchMock.mockImplementation(async (input: string, init?: RequestInit) =>
    init?.method && init.method !== 'GET' ? jsonResponse(body, status) : respond(input, init),
  )
}

function employeesRequests() {
  return fetchMock.mock.calls
    .filter(([, init]) => (init?.method ?? 'GET') === 'GET')
    .map(([input]) => new URL(input))
    .filter((url) => url.pathname === '/employees')
}

function writeRequests() {
  return fetchMock.mock.calls
    .filter(([, init]) => init?.method && init.method !== 'GET')
    .map(([input, init]) => ({
      method: init?.method,
      path: new URL(input).pathname,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    }))
}

async function chooseOption(user: UserEvent, container: HTMLElement, label: string, option: string) {
  await user.click(within(container).getByRole('combobox', { name: label }))
  await user.click(await screen.findByRole('option', { name: option }))
}

async function fillNewEmployee(user: UserEvent, dialog: HTMLElement) {
  await user.type(within(dialog).getByRole('textbox', { name: 'Full name' }), 'Alex Kim')
  await user.type(within(dialog).getByRole('textbox', { name: 'Email' }), 'alex@example.com')
  await user.type(within(dialog).getByRole('combobox', { name: 'Job title' }), 'Designer')
  await user.type(within(dialog).getByRole('combobox', { name: 'Department' }), 'Design')
  await chooseOption(user, dialog, 'Country', 'United States')
  await chooseOption(user, dialog, 'Employment type', 'part time')
  await user.type(within(dialog).getByRole('spinbutton', { name: 'Annual salary' }), '90000')
  await user.type(within(dialog).getByLabelText('Hire date'), '2024-01-15')
}

async function openAddDialog(user: UserEvent) {
  await screen.findByText('Priya Sharma')
  await user.click(screen.getByRole('button', { name: 'Add employee' }))
  return screen.findByRole('dialog', { name: 'Add employee' })
}

function lastEmployeesQuery() {
  return employeesRequests().at(-1)!.searchParams
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <EmployeesPage />
    </QueryClientProvider>,
  )
}

describe('EmployeesPage', () => {
  beforeEach(() => stubApi())
  afterEach(() => vi.unstubAllGlobals())

  it('shows rows from the API with formatted salary and country name', async () => {
    renderPage()

    expect(await screen.findByText('Priya Sharma')).toBeInTheDocument()
    expect(screen.getByText('₹1,500,000')).toBeInTheDocument()
    expect(screen.getByText('India')).toBeInTheDocument()
  })

  it('shows each employee’s id in an ID column', async () => {
    renderPage()

    const row = (await screen.findByText('Priya Sharma')).closest('[role="row"]') as HTMLElement
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('ID')
    expect(within(row).getAllByRole('gridcell')[0]).toHaveTextContent('1')
  })

  it('refetches the first page with the selected country', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Priya Sharma')

    await user.click(screen.getByRole('button', { name: /next page/i }))
    await waitFor(() => expect(lastEmployeesQuery().get('page')).toBe('2'))

    await user.click(screen.getByRole('combobox', { name: 'Country' }))
    await user.click(await screen.findByRole('option', { name: 'India' }))

    await waitFor(() => expect(lastEmployeesQuery().get('country')).toBe('IN'))
    expect(lastEmployeesQuery().get('page')).toBe('1')
  })

  it('sends one search request after the debounce, not one per keystroke', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Priya Sharma')

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'Priya')

    await waitFor(() => expect(lastEmployeesQuery().get('search')).toBe('Priya'))
    const searches = employeesRequests().filter((url) => url.searchParams.has('search'))
    expect(searches).toHaveLength(1)
  })

  it('shows an error message when the API fails', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ detail: 'boom' }, 500))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load employees/i)
  })

  it('creates an employee, closes the dialog and refreshes the list', async () => {
    const user = userEvent.setup()
    renderPage()
    const dialog = await openAddDialog(user)
    const listRequestsBefore = employeesRequests().length

    await fillNewEmployee(user, dialog)
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    expect(writeRequests()).toEqual([
      {
        method: 'POST',
        path: '/employees',
        body: {
          full_name: 'Alex Kim',
          email: 'alex@example.com',
          job_title: 'Designer',
          department: 'Design',
          country: 'US',
          employment_type: 'part_time',
          annual_salary: 90000,
          hire_date: '2024-01-15',
        },
      },
    ])
    await waitFor(() => expect(employeesRequests().length).toBeGreaterThan(listRequestsBefore))
    expect(screen.getByText('Employee added')).toBeInTheDocument()
  })

  it('shows a field error for invalid input and sends no request', async () => {
    const user = userEvent.setup()
    renderPage()
    const dialog = await openAddDialog(user)

    await fillNewEmployee(user, dialog)
    await user.clear(within(dialog).getByRole('spinbutton', { name: 'Annual salary' }))
    await user.type(within(dialog).getByRole('spinbutton', { name: 'Annual salary' }), '0')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(within(dialog).getByRole('spinbutton', { name: 'Annual salary' })).toHaveAccessibleDescription(
      'Salary must be greater than 0',
    )
    expect(writeRequests()).toEqual([])
  })

  it('shows a 409 response as an error on the email field', async () => {
    const user = userEvent.setup()
    rejectWritesWith(409, { detail: 'Email already exists: alex@example.com' })
    renderPage()
    const dialog = await openAddDialog(user)

    await fillNewEmployee(user, dialog)
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(within(dialog).getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
        'An employee with this email already exists',
      ),
    )
    expect(dialog).toBeInTheDocument()
  })

  it('shows a 422 error on the field the response identifies', async () => {
    const user = userEvent.setup()
    rejectWritesWith(422, {
      detail: [{ loc: ['body', 'hire_date'], msg: 'Value error, hire_date cannot be in the future' }],
    })
    renderPage()
    const dialog = await openAddDialog(user)

    await fillNewEmployee(user, dialog)
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(within(dialog).getByLabelText('Hire date')).toHaveAccessibleDescription(
        'Value error, hire_date cannot be in the future',
      ),
    )
  })

  it('shows a 422 error that names no field as a general message in the dialog', async () => {
    const user = userEvent.setup()
    rejectWritesWith(422, { detail: 'Unsupported country: US' })
    renderPage()
    const dialog = await openAddDialog(user)

    await fillNewEmployee(user, dialog)
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Unsupported country: US')
  })

  it('pre-fills the edit form and sends only the changed fields', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Priya Sharma')

    await user.click(screen.getByRole('button', { name: 'Edit Priya Sharma' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit employee' })
    expect(within(dialog).getByRole('textbox', { name: 'Full name' })).toHaveValue('Priya Sharma')
    expect(within(dialog).getByRole('combobox', { name: 'Department' })).toHaveValue('Engineering')
    expect(within(dialog).getByRole('combobox', { name: 'Country' })).toHaveTextContent('India')
    expect(within(dialog).getByLabelText('Hire date')).toHaveValue('2022-04-01')

    const salary = within(dialog).getByRole('spinbutton', { name: 'Annual salary' })
    expect(salary).toHaveValue(1500000)
    await user.clear(salary)
    await user.type(salary, '1600000')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    expect(writeRequests()).toEqual([{ method: 'PATCH', path: '/employees/1', body: { annual_salary: 1600000 } }])
    expect(screen.getByText('Employee updated')).toBeInTheDocument()
  })

  it('shows the chosen country’s currency read-only', async () => {
    const user = userEvent.setup()
    renderPage()
    const dialog = await openAddDialog(user)

    await chooseOption(user, dialog, 'Country', 'United States')

    const currency = within(dialog).getByRole('textbox', { name: 'Currency' })
    expect(currency).toHaveValue('USD')
    expect(currency).toHaveAttribute('readonly')
  })

  it('deletes an employee only after confirmation, then refreshes the list', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Priya Sharma')

    await user.click(screen.getByRole('button', { name: 'Delete Priya Sharma' }))
    const cancelled = await screen.findByRole('dialog', { name: 'Delete employee?' })
    await user.click(within(cancelled).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(cancelled).not.toBeInTheDocument())
    expect(writeRequests()).toEqual([])

    const listRequestsBefore = employeesRequests().length
    await user.click(screen.getByRole('button', { name: 'Delete Priya Sharma' }))
    const confirm = await screen.findByRole('dialog', { name: 'Delete employee?' })
    expect(confirm).toHaveTextContent('Priya Sharma')
    await user.click(within(confirm).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(confirm).not.toBeInTheDocument())
    expect(writeRequests()).toEqual([{ method: 'DELETE', path: '/employees/1', body: undefined }])
    await waitFor(() => expect(employeesRequests().length).toBeGreaterThan(listRequestsBefore))
    expect(screen.getByText('Employee deleted')).toBeInTheDocument()
  })
})
