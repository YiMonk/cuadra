import { api } from '@/lib/api';

export interface CompanyData {
  name: string;
  rif?: string;
  modules_enabled: string[];
}

export interface CompanyOut {
  id: string;
  name: string;
  rif?: string;
  plan: string;
  modules_enabled: string[];
  subscription_ends_at?: string;
  created_at: string;
}

export interface AccessAccountData {
  email: string;
  password?: string;
  name: string;
  role: 'cashier' | 'viewer';
  module_access: string[];
}

export interface AccessAccountOut {
  id: string;
  email: string;
  name: string;
  role: string;
  module_access: string[];
  active: boolean;
  company_id: string;
}

export interface LocationData {
  name: string;
  address?: string;
  phone?: string;
}

export interface LocationOut {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  active: boolean;
  company_id: string;
}

export interface SelectCompanyResponse {
  access_token: string;
  refresh_token: string;
}

export const companyService = {
  getCompanies: () =>
    api.get<CompanyOut[]>('/api/v1/companies'),

  getCompany: (id: string) =>
    api.get<CompanyOut>(`/api/v1/companies/${id}`),

  createCompany: (data: CompanyData) =>
    api.post<CompanyOut>('/api/v1/companies', data),

  updateCompany: (id: string, data: Partial<CompanyData>) =>
    api.patch<CompanyOut>(`/api/v1/companies/${id}`, data),

  selectCompany: (company_id: string) =>
    api.post<SelectCompanyResponse>('/api/v1/auth/select-company', { company_id }),

  getAccessAccounts: (companyId: string) =>
    api.get<AccessAccountOut[]>(`/api/v1/companies/${companyId}/access-accounts`),

  createAccessAccount: (companyId: string, data: AccessAccountData) =>
    api.post<AccessAccountOut>(`/api/v1/companies/${companyId}/access-accounts`, data),

  updateAccessAccount: (companyId: string, accountId: string, data: Partial<AccessAccountData>) =>
    api.patch<AccessAccountOut>(`/api/v1/companies/${companyId}/access-accounts/${accountId}`, data),

  setAccountPassword: (companyId: string, accountId: string, new_password: string) =>
    api.patch<AccessAccountOut>(
      `/api/v1/companies/${companyId}/access-accounts/${accountId}/password`,
      { new_password }
    ),

  setAccountStatus: (companyId: string, accountId: string, active: boolean) =>
    api.patch<AccessAccountOut>(
      `/api/v1/companies/${companyId}/access-accounts/${accountId}/status`,
      { active }
    ),

  getLocations: (companyId: string) =>
    api.get<LocationOut[]>(`/api/v1/companies/${companyId}/locations`),

  createLocation: (companyId: string, data: LocationData) =>
    api.post<LocationOut>(`/api/v1/companies/${companyId}/locations`, data),

  updateLocation: (companyId: string, locationId: string, data: Partial<LocationData>) =>
    api.patch<LocationOut>(`/api/v1/companies/${companyId}/locations/${locationId}`, data),

  deleteLocation: (companyId: string, locationId: string) =>
    api.delete<void>(`/api/v1/companies/${companyId}/locations/${locationId}`),
};
