import { apiGet } from './client'

export type EmploymentType = 'full_time' | 'part_time' | 'contract'

export interface Employee {
  id: number
  full_name: string
  email: string
  job_title: string
  department: string
  country: string
  currency: string
  employment_type: EmploymentType
  annual_salary: number
  hire_date: string
}

export interface EmployeeListResponse {
  items: Employee[]
  total: number
  page: number
  page_size: number
}

export interface EmployeeFilters {
  search: string
  country: string
  department: string
  jobTitle: string
}

export interface ListEmployeesParams extends EmployeeFilters {
  /** 0-based, as used by the DataGrid. */
  page: number
  pageSize: number
}

export function listEmployees(params: ListEmployeesParams): Promise<EmployeeListResponse> {
  const query: Record<string, string> = {
    // The DataGrid's pages are 0-based; the API's are 1-based.
    page: String(params.page + 1),
    page_size: String(params.pageSize),
  }
  const filters = {
    search: params.search,
    country: params.country,
    department: params.department,
    job_title: params.jobTitle,
  }
  for (const [key, value] of Object.entries(filters)) {
    if (value) query[key] = value
  }
  return apiGet<EmployeeListResponse>('/employees', query)
}
