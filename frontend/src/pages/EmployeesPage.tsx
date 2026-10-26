import { useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { DataGrid, GridActionsCellItem, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid'
import { listEmployees, type Employee, type EmployeeFilters } from '../api/employees'
import { countryName, employmentTypeLabel, formatSalary } from '../format'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { DeleteIcon, EditIcon } from '../icons'
import DeleteEmployeeDialog from './DeleteEmployeeDialog'
import EmployeeFiltersToolbar from './EmployeeFiltersToolbar'
import EmployeeFormDialog from './EmployeeFormDialog'

const dataColumns: GridColDef<Employee>[] = [
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
    valueFormatter: (value: string) => employmentTypeLabel(value),
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

  // null: dialog closed; 'new': adding; an employee: editing them.
  const [formTarget, setFormTarget] = useState<Employee | 'new' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const handleSaved = (message: string) => {
    setFormTarget(null)
    setConfirmation(message)
  }

  const handleDeleted = () => {
    setDeleteTarget(null)
    setConfirmation('Employee deleted')
  }

  const columns = useMemo<GridColDef<Employee>[]>(
    () => [
      ...dataColumns,
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        getActions: ({ row }) => [
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon />}
            label={`Edit ${row.full_name}`}
            onClick={() => setFormTarget(row)}
          />,
          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon />}
            label={`Delete ${row.full_name}`}
            onClick={() => setDeleteTarget(row)}
          />,
        ],
      },
    ],
    [],
  )

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <EmployeeFiltersToolbar filters={filters} onChange={setFilters} />
        <Button variant="contained" onClick={() => setFormTarget('new')} sx={{ flexShrink: 0 }}>
          Add employee
        </Button>
      </Stack>
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
      {formTarget && (
        <EmployeeFormDialog
          employee={formTarget === 'new' ? undefined : formTarget}
          onClose={() => setFormTarget(null)}
          onSaved={handleSaved}
        />
      )}
      {deleteTarget && (
        <DeleteEmployeeDialog
          employee={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
      <Snackbar
        open={confirmation !== null}
        autoHideDuration={4000}
        onClose={() => setConfirmation(null)}
        message={confirmation}
      />
    </Stack>
  )
}
