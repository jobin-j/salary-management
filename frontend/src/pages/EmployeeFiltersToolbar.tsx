import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useQuery } from '@tanstack/react-query'
import type { EmployeeFilters } from '../api/employees'
import { getOptions } from '../api/options'
import { countryName } from '../format'

interface Props {
  filters: EmployeeFilters
  onChange: (filters: EmployeeFilters) => void
}

interface FilterSelectProps {
  label: string
  value: string
  choices: { value: string; label: string }[]
  onChange: (value: string) => void
}

function FilterSelect({ label, value, choices, onChange }: FilterSelectProps) {
  return (
    <TextField
      select
      size="small"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ minWidth: 180 }}
    >
      <MenuItem value="">All</MenuItem>
      {choices.map((choice) => (
        <MenuItem key={choice.value} value={choice.value}>
          {choice.label}
        </MenuItem>
      ))}
    </TextField>
  )
}

const asChoices = (values: string[]) => values.map((value) => ({ value, label: value }))

export default function EmployeeFiltersToolbar({ filters, onChange }: Props) {
  const { data: options } = useQuery({ queryKey: ['options'], queryFn: getOptions })

  const countries = (options?.countries ?? []).map((c) => ({ value: c.code, label: countryName(c.code) }))

  return (
    <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
      <TextField
        type="search"
        size="small"
        label="Search"
        placeholder="Name"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        sx={{ minWidth: 240 }}
      />
      <FilterSelect
        label="Country"
        value={filters.country}
        choices={countries}
        onChange={(country) => onChange({ ...filters, country })}
      />
      <FilterSelect
        label="Department"
        value={filters.department}
        choices={asChoices(options?.departments ?? [])}
        onChange={(department) => onChange({ ...filters, department })}
      />
      <FilterSelect
        label="Job title"
        value={filters.jobTitle}
        choices={asChoices(options?.job_titles ?? [])}
        onChange={(jobTitle) => onChange({ ...filters, jobTitle })}
      />
    </Stack>
  )
}
