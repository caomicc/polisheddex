import { parseAsIndex, parseAsInteger, useQueryStates } from 'nuqs';

const paginationParsers = {
  pageIndex: parseAsIndex.withDefault(0),
  pageSize: parseAsInteger.withDefault(20),
};

const paginationUrlKeys = {
  pageIndex: 'page',
  pageSize: 'perPage',
};

export function usePaginationSearchParams() {
  return useQueryStates(paginationParsers, {
    urlKeys: paginationUrlKeys,
  });
}
