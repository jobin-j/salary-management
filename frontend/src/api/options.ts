import { apiGet } from './client'
import type { EmploymentType } from './employees'

export interface CountryOption {
  code: string
  currency: string
}

export interface OptionsResponse {
  countries: CountryOption[]
  departments: string[]
  job_titles: string[]
  employment_types: EmploymentType[]
}

export function getOptions(): Promise<OptionsResponse> {
  return apiGet<OptionsResponse>('/options')
}
