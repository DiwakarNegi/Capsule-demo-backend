interface IMeta {
  page: number;
  perPage: number;
  total: number;
}

export interface Paginate<T> {
  data: T[];
  meta: IMeta;
}
