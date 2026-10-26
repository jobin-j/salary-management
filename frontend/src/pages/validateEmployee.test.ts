import { describe, expect, it } from 'vitest'
import { validateEmployee, type EmployeeFormValues } from './validateEmployee'

const today = '2026-10-26'

const valid: EmployeeFormValues = {
  full_name: 'Priya Sharma',
  email: 'priya@example.com',
  job_title: 'Engineer',
  department: 'Engineering',
  country: 'IN',
  employment_type: 'full_time',
  annual_salary: '1500000',
  hire_date: '2022-04-01',
}

describe('validateEmployee', () => {
  it('reports nothing for valid input', () => {
    expect(validateEmployee(valid, today)).toEqual({})
  })

  it('reports a missing name, ignoring surrounding whitespace', () => {
    expect(validateEmployee({ ...valid, full_name: '  ' }, today)).toEqual({ full_name: 'Required' })
  })

  it('reports a badly formed email', () => {
    expect(validateEmployee({ ...valid, email: 'priya@' }, today)).toEqual({ email: 'Enter a valid email' })
  })

  it('reports a salary that is not greater than 0', () => {
    expect(validateEmployee({ ...valid, annual_salary: '0' }, today)).toEqual({
      annual_salary: 'Salary must be greater than 0',
    })
  })

  it('reports a hire date after today, but accepts today', () => {
    expect(validateEmployee({ ...valid, hire_date: '2026-10-27' }, today)).toEqual({
      hire_date: 'Hire date cannot be in the future',
    })
    expect(validateEmployee({ ...valid, hire_date: today }, today)).toEqual({})
  })
})
