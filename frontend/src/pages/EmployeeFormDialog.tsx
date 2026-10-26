import { useState, type FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/client'
import {
  createEmployee,
  updateEmployee,
  type Employee,
  type EmployeeInput,
  type EmploymentType,
} from '../api/employees'
import { getOptions } from '../api/options'
import { countryName, employmentTypeLabel } from '../format'
import { validateEmployee, type EmployeeFormErrors, type EmployeeFormValues } from './validateEmployee'

interface Props {
  /** The employee to edit; omitted when adding a new one. */
  employee?: Employee
  onClose: () => void
  /** Called after a successful save, with a confirmation message to show. */
  onSaved: (message: string) => void
}

const emptyValues: EmployeeFormValues = {
  full_name: '',
  email: '',
  job_title: '',
  department: '',
  country: '',
  employment_type: '',
  annual_salary: '',
  hire_date: '',
}

function toValues(employee: Employee): EmployeeFormValues {
  return {
    full_name: employee.full_name,
    email: employee.email,
    job_title: employee.job_title,
    department: employee.department,
    country: employee.country,
    employment_type: employee.employment_type,
    annual_salary: String(employee.annual_salary),
    hire_date: employee.hire_date,
  }
}

function toInput(values: EmployeeFormValues): EmployeeInput {
  return {
    full_name: values.full_name.trim(),
    email: values.email.trim(),
    job_title: values.job_title.trim(),
    department: values.department.trim(),
    country: values.country,
    employment_type: values.employment_type as EmploymentType,
    annual_salary: Number(values.annual_salary),
    hire_date: values.hire_date,
  }
}

function changedFields(input: EmployeeInput, employee: Employee): Partial<EmployeeInput> {
  return Object.fromEntries(
    Object.entries(input).filter(([field, value]) => employee[field as keyof EmployeeInput] !== value),
  )
}

function isFormField(name: unknown): name is keyof EmployeeFormValues {
  return typeof name === 'string' && name in emptyValues
}

/** Maps a failed save onto form fields, where the response identifies them. */
function serverErrors(error: Error): EmployeeFormErrors {
  if (!(error instanceof ApiError)) return {}
  if (error.status === 409) return { email: 'An employee with this email already exists' }
  const errors: EmployeeFormErrors = {}
  const detail = (error.body as { detail?: unknown } | null)?.detail
  if (error.status === 422 && Array.isArray(detail)) {
    // FastAPI validation errors locate the field as ['body', <field>].
    for (const item of detail as { loc?: unknown[]; msg?: string }[]) {
      const field = item.loc?.[1]
      if (isFormField(field)) errors[field] = item.msg
    }
  }
  return errors
}

/** The message to show in the dialog when no field explains a failed save. */
function generalMessage(error: Error): string {
  const detail = error instanceof ApiError ? (error.body as { detail?: unknown } | null)?.detail : undefined
  return typeof detail === 'string' ? detail : 'Could not save the employee. Please try again.'
}

/** Today's date in the user's time zone, as YYYY-MM-DD. */
function localToday() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

interface SuggestFieldProps {
  label: string
  value: string
  suggestions: string[]
  error?: string
  onChange: (value: string) => void
}

/** Free text with suggestions of the values already in use. */
function SuggestField({ label, value, suggestions, error, onChange }: SuggestFieldProps) {
  return (
    <Autocomplete
      freeSolo
      options={suggestions}
      inputValue={value}
      onInputChange={(_, newValue) => onChange(newValue)}
      renderInput={(params) => <TextField {...params} label={label} required error={!!error} helperText={error} />}
    />
  )
}

export default function EmployeeFormDialog({ employee, onClose, onSaved }: Props) {
  const queryClient = useQueryClient()
  const { data: options } = useQuery({ queryKey: ['options'], queryFn: getOptions })
  const [values, setValues] = useState(() => (employee ? toValues(employee) : emptyValues))
  const [errors, setErrors] = useState<EmployeeFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const errorProps = (field: keyof EmployeeFormValues) => ({ error: !!errors[field], helperText: errors[field] })

  // Saving an edit with nothing changed would send an empty PATCH.
  const unchanged = employee !== undefined && Object.keys(changedFields(toInput(values), employee)).length === 0

  const currency = options?.countries.find((c) => c.code === values.country)?.currency ?? ''

  const set = (field: keyof EmployeeFormValues) => (value: string) => setValues({ ...values, [field]: value })

  const mutation = useMutation({
    mutationFn: (input: EmployeeInput) =>
      employee ? updateEmployee(employee.id, changedFields(input, employee)) : createEmployee(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['options'] })
      onSaved(employee ? 'Employee updated' : 'Employee added')
    },
    onError: (error) => {
      const fieldErrors = serverErrors(error)
      setErrors(fieldErrors)
      setFormError(Object.keys(fieldErrors).length > 0 ? null : generalMessage(error))
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const validationErrors = validateEmployee(values, localToday())
    setErrors(validationErrors)
    setFormError(null)
    if (Object.keys(validationErrors).length === 0) mutation.mutate(toInput(values))
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="employee-form-title">
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle id="employee-form-title">{employee ? 'Edit employee' : 'Add employee'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Full name"
              required
              value={values.full_name}
              onChange={(e) => set('full_name')(e.target.value)}
              {...errorProps('full_name')}
            />
            <TextField
              label="Email"
              required
              type="email"
              value={values.email}
              onChange={(e) => set('email')(e.target.value)}
              {...errorProps('email')}
            />
            <SuggestField
              label="Job title"
              value={values.job_title}
              error={errors.job_title}
              suggestions={options?.job_titles ?? []}
              onChange={set('job_title')}
            />
            <SuggestField
              label="Department"
              value={values.department}
              error={errors.department}
              suggestions={options?.departments ?? []}
              onChange={set('department')}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Country"
                required
                value={values.country}
                onChange={(e) => set('country')(e.target.value)}
                {...errorProps('country')}
                sx={{ flex: 1 }}
              >
                {(options?.countries ?? []).map((country) => (
                  <MenuItem key={country.code} value={country.code}>
                    {countryName(country.code)}
                  </MenuItem>
                ))}
              </TextField>
              {/* The server derives the currency from the country. */}
              <TextField
                label="Currency"
                value={currency}
                slotProps={{ htmlInput: { readOnly: true } }}
                sx={{ width: 120 }}
              />
            </Stack>
            <TextField
              select
              label="Employment type"
              required
              value={values.employment_type}
              onChange={(e) => set('employment_type')(e.target.value)}
              {...errorProps('employment_type')}
            >
              {(options?.employment_types ?? []).map((type) => (
                <MenuItem key={type} value={type}>
                  {employmentTypeLabel(type)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Annual salary"
              required
              type="number"
              value={values.annual_salary}
              onChange={(e) => set('annual_salary')(e.target.value)}
              {...errorProps('annual_salary')}
            />
            <TextField
              label="Hire date"
              required
              type="date"
              value={values.hire_date}
              onChange={(e) => set('hire_date')(e.target.value)}
              {...errorProps('hire_date')}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" loading={mutation.isPending} disabled={unchanged}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
