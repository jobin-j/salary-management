import { apiGet } from './client'
import type { EmploymentType } from './employees'

export type EmploymentTypeFilter = EmploymentType | 'all'

interface SalaryStats {
  headcount: number
  min: number
  max: number
  mean: number
  median: number
}

export interface CountryInsight extends SalaryStats {
  country: string
  currency: string
}

export interface JobTitleInsight extends SalaryStats {
  job_title: string
  department: string
}

export interface CountryJobTitleInsights {
  country: string
  currency: string
  items: JobTitleInsight[]
}

export function getCountryInsights(employmentType: EmploymentTypeFilter): Promise<CountryInsight[]> {
  return apiGet<CountryInsight[]>('/insights/countries', { employment_type: employmentType })
}

export function getJobTitleInsights(
  country: string,
  employmentType: EmploymentTypeFilter,
): Promise<CountryJobTitleInsights> {
  return apiGet<CountryJobTitleInsights>(`/insights/countries/${encodeURIComponent(country)}/job-titles`, {
    employment_type: employmentType,
  })
}
