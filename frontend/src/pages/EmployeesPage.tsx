import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid'
import { listEmployees, type Employee, type EmployeeFilters } from '../api/employees'
import { countryName, formatSalary } from '../format'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import EmployeeFiltersToolbar from './EmployeeFiltersToolbar'

const columns: GridColDef<Employee>[] = [
  { field: 'full_name', headerName: 'Name', flex: 1, minWidth: 160 },
  { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
  { field: 'job_title', headerName: 'Job title', flex: 1, minWidth: 140 },
  { field: 'department', headerName: 'Department', minWidth: 130 },
  {
    field: 'country',
    headerName: 'Country',
    minWidth: 130,
    valueFormatter: (value: string) => countryName(value),
  },
  {
    field: 'employment_type',
    headerName: 'Employment type',
    minWidth: 140,
    valueFormatter: (value: string) => value.replace('_', ' '),
  },
  {
    field: 'annual_salary',
    headerName: 'Salary',
    type: 'number',
    minWidth: 140,
    valueFormatter: (value: number, row) => formatSalary(value, row.currency),
  },
  { field: 'hire_date', headerName: 'Hire date', minWidth: 110 },
]

const emptyFilters: EmployeeFilters = { search: '', country: '', department: '', jobTitle: '' }

function sameFilters(a: EmployeeFilters, b: EmployeeFilters) {
  return (
    a.search === b.search &&
    a.country === b.country &&
    a.department === b.department &&
    a.jobTitle === b.jobTitle
  )
}

export default function EmployeesPage() {
  // `filters` follows the inputs; `appliedFilters` (debounced search) drives the query.
  const [filters, setFilters] = useState(emptyFilters)
  const debouncedSearch = useDebouncedValue(filters.search)
  const appliedFilters = { ...filters, search: debouncedSearch }
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 })

  // Any change to the applied filters returns to the first page.
  const [previousFilters, setPreviousFilters] = useState(appliedFilters)
  if (!sameFilters(previousFilters, appliedFilters)) {
    setPreviousFilters(appliedFilters)
    setPaginationModel({ ...paginationModel, page: 0 })
  }

  const { data, isFetching, isError } = useQuery({
    queryKey: ['employees', appliedFilters, paginationModel],
    queryFn: () => listEmployees({ ...appliedFilters, ...paginationModel }),
    placeholderData: keepPreviousData,
  })

  return (
    <Stack spacing={2}>
      <EmployeeFiltersToolbar filters={filters} onChange={setFilters} />
      {isError && <Alert severity="error">Could not load employees. Please try again.</Alert>}
      <Box sx={{ height: 640 }}>
        <DataGrid
          rows={data?.items ?? []}
          columns={columns}
          rowCount={data?.total ?? 0}
          loading={isFetching}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[20, 50, 100]}
          disableColumnSorting
          disableColumnFilter
        />
      </Box>
    </Stack>
  )
}
