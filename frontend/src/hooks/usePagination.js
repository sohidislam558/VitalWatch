import { useState } from 'react';

export function usePagination(initialPage = 1, initialPerPage = 10) {
  const [page, setPage] = useState(initialPage);
  const [perPage, setPerPage] = useState(initialPerPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const updatePaginationData = (meta) => {
    if (meta) {
      setPage(meta.current_page || 1);
      setPerPage(meta.per_page || initialPerPage);
      setTotalPages(meta.last_page || 1);
      setTotalItems(meta.total || 0);
    }
  };

  return {
    page,
    perPage,
    totalPages,
    totalItems,
    setPage: handlePageChange,
    setPerPage,
    updatePaginationData,
  };
}

