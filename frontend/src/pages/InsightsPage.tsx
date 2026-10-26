import { useState, type ReactNode } from 'react'
import Alert from '@mui/material/Alert'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import {
  getCountryInsights,
  getJobTitleInsights,
  type CountryInsight,
  type EmploymentTypeFilter,
} from '../api/insights'
import { countryName, formatSalary } from '../format'

const statColumns = ['min', 'median', 'mean', 'max'] as const

type SalaryStats = Pick<CountryInsight, 'headcount' | (typeof statColumns)[number]>

const employmentTypeChoices: { value: EmploymentTypeFilter; label: string }[] = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'all', label: 'All' },
]

function StatHeaderCells() {
  return (
    <>
      <TableCell align="right">Headcount</TableCell>
      <TableCell align="right">Min</TableCell>
      <TableCell align="right">Median</TableCell>
      <TableCell align="right">Mean</TableCell>
      <TableCell align="right">Max</TableCell>
    </>
  )
}

function StatCells({ stats, currency }: { stats: SalaryStats; currency: string }) {
  return (
    <>
      <TableCell align="right">{stats.headcount}</TableCell>
      {statColumns.map((stat) => (
        <TableCell key={stat} align="right">
          {formatSalary(stats[stat], currency)}
        </TableCell>
      ))}
    </>
  )
}

const columnCount = 7

function MessageRow({ children }: { children: ReactNode }) {
  return (
    <TableRow>
      <TableCell colSpan={columnCount} align="center" sx={{ color: 'text.secondary', py: 3 }}>
        {children}
      </TableCell>
    </TableRow>
  )
}

const emptyMessage = 'No employees of this type yet.'
const loadingMessage = 'Loading…'
const errorMessage = 'Could not load insights. Please try again.'

function JobTitleBreakdown({ country, employmentType }: { country: string; employmentType: EmploymentTypeFilter }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['insights', 'job-titles', country, employmentType],
    queryFn: () => getJobTitleInsights(country, employmentType),
  })
  const headingId = 'job-title-breakdown-heading'

  return (
    <Stack spacing={1}>
      <Typography variant="h6" component="h2" id={headingId}>
        Job titles in {countryName(country)}
      </Typography>
      {isError && <Alert severity="error">{errorMessage}</Alert>}
      <Table size="small" aria-labelledby={headingId}>
        <TableHead>
          <TableRow>
            <TableCell>Job title</TableCell>
            <TableCell>Department</TableCell>
            <StatHeaderCells />
          </TableRow>
        </TableHead>
        <TableBody>
          {isPending && <MessageRow>{loadingMessage}</MessageRow>}
          {data?.items.length === 0 && <MessageRow>{emptyMessage}</MessageRow>}
          {data?.items.map((row) => (
            <TableRow key={`${row.job_title}-${row.department}`}>
              <TableCell>{row.job_title}</TableCell>
              <TableCell>{row.department}</TableCell>
              <StatCells stats={row} currency={data.currency} />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  )
}

export default function InsightsPage() {
  // Full-time by default: part-time pay is pro-rated and would skew the figures (decision 014).
  const [employmentType, setEmploymentType] = useState<EmploymentTypeFilter>('full_time')
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)

  const { data, isPending, isError } = useQuery({
    queryKey: ['insights', 'countries', employmentType],
    queryFn: () => getCountryInsights(employmentType),
  })

  return (
    <Stack spacing={2}>
      <TextField
        select
        size="small"
        label="Employment type"
        value={employmentType}
        onChange={(e) => setEmploymentType(e.target.value as EmploymentTypeFilter)}
        sx={{ width: 200 }}
      >
        {employmentTypeChoices.map((choice) => (
          <MenuItem key={choice.value} value={choice.value}>
            {choice.label}
          </MenuItem>
        ))}
      </TextField>
      <Typography variant="body2" color="text.secondary">
        Median is typical pay; the mean can be pulled up by a few high earners. Select a country to see its job
        titles.
      </Typography>
      {isError && <Alert severity="error">{errorMessage}</Alert>}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Country</TableCell>
            <TableCell>Currency</TableCell>
            <StatHeaderCells />
          </TableRow>
        </TableHead>
        <TableBody>
          {isPending && <MessageRow>{loadingMessage}</MessageRow>}
          {data?.length === 0 && <MessageRow>{emptyMessage}</MessageRow>}
          {data?.map((row) => (
            <TableRow
              key={row.country}
              hover
              selected={row.country === selectedCountry}
              aria-selected={row.country === selectedCountry}
              tabIndex={0}
              onClick={() => setSelectedCountry(row.country)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault() // Space would otherwise scroll the page.
                  setSelectedCountry(row.country)
                }
              }}
              sx={{
                cursor: 'pointer',
                // Negative offset keeps the outline inside the row, clear of the table edges.
                '&:focus-visible': {
                  outline: (theme) => `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: '-2px',
                },
              }}
            >
              <TableCell>{countryName(row.country)}</TableCell>
              <TableCell>{row.currency}</TableCell>
              <StatCells stats={row} currency={row.currency} />
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedCountry && <JobTitleBreakdown country={selectedCountry} employmentType={employmentType} />}
    </Stack>
  )
}
