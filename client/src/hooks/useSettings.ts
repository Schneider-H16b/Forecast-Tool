import { useQuery } from '@tanstack/react-query';
import { fetchEmployees, fetchBlockers, fetchItems, type EmployeeDto, type BlockerDto, type ItemDto } from '../api/settings';

export function useEmployees() {
  return useQuery<{ data: EmployeeDto[] }, Error, EmployeeDto[]>({
    queryKey: ['settings','employees'],
    queryFn: async () => ({ data: await fetchEmployees() }),
    select: (r) => r.data,
  });
}

export function useBlockers(filter?: { employeeId?: string; dateIso?: string }) {
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
