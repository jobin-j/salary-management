import type { EmploymentType } from '../api/employees'

/** Form state: every input holds a string until it is submitted. */
export interface EmployeeFormValues {
  full_name: string
  email: string
  job_title: string
  department: string
  country: string
  employment_type: EmploymentType | ''
  annual_salary: string
  hire_date: string
}

export type EmployeeFormErrors = Partial<Record<keyof EmployeeFormValues, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmployee(values: EmployeeFormValues, today: string): EmployeeFormErrors {
  const errors: EmployeeFormErrors = {}
  for (const [field, value] of Object.entries(values) as [keyof EmployeeFormValues, string][]) {
    if (!value.trim()) errors[field] = 'Required'
  }
  // A rough check for instant feedback; the server's EmailStr is the authority.
  if (!errors.email && !EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email'
  if (!errors.annual_salary && !(Number(values.annual_salary) > 0)) {
    errors.annual_salary = 'Salary must be greater than 0'
  }
  // Both are ISO dates (YYYY-MM-DD), so string order is date order.
  if (!errors.hire_date && values.hire_date > today) errors.hire_date = 'Hire date cannot be in the future'
  return errors
}
