export interface QueryFilters {
  status?: string;
  source?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const SEARCHABLE_FIELDS = [
  'fullName',
  'email',
  'phone',
  'serviceType',
  'reservationNumber',
] as const;

export const buildFilters = (query: QueryFilters): Record<string, unknown> => {
  const filters: Record<string, unknown> = {};

  if (query.status) {
    filters.status = query.status;
  }

  if (query.source) {
    filters.source = query.source;
  }

  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    filters.$or = SEARCHABLE_FIELDS.map((field) => ({ [field]: regex }));
  }

  return filters;
};