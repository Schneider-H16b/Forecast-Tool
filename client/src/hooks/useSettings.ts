import { useQuery } from '@tanstack/react-query';
import { fetchEmployees, fetchBlockers, fetchItems, fetchGlobalSettings, fetchAutoPlanSettings, type EmployeeDto, type BlockerDto, type ItemDto, type GlobalSettingsDto, type AutoPlanSettingsDto } from '../api/settings';

export function useEmployees() {
  return useQuery<{ data: EmployeeDto[] }, Error, EmployeeDto[]>({
    queryKey: ['settings','employees'],
    queryFn: async () => ({ data: await fetchEmployees() }),
    select: (r) => r.data,
  });
}

export function useBlockers(filter?: { employeeId?: string; dateIso?: string; monthIso?: string }) {
  return useQuery<{ data: BlockerDto[] }, Error, BlockerDto[]>({
    queryKey: ['settings','blockers', filter ?? {}],
    queryFn: async () => ({ data: await fetchBlockers(filter) }),
    select: (r) => r.data,
  });
}

export function useItems() {
  return useQuery<{ data: ItemDto[] }, Error, ItemDto[]>({
    queryKey: ['settings','items'],
    queryFn: async () => ({ data: await fetchItems() }),
    select: (r) => r.data,
  });
}

export function useGlobalSettings() {
  return useQuery<{ data: GlobalSettingsDto }, Error, GlobalSettingsDto>({
    queryKey: ['settings','global'],
    queryFn: async () => ({ data: await fetchGlobalSettings() }),
    select: (r) => r.data,
  });
}

export function useAutoPlanSettings() {
  return useQuery<{ data: AutoPlanSettingsDto }, Error, AutoPlanSettingsDto>({
    queryKey: ['settings','autoplan'],
    queryFn: async () => ({ data: await fetchAutoPlanSettings() }),
    select: (r) => r.data,
  });
}
