type UsePaginationProps = {
  currentPage: number;
  totalPages: number;
  paginationItemsToDisplay: number;
};

type UsePaginationReturn = {
  pages: number[];
  showLeftEllipsis: boolean;
  showRightEllipsis: boolean;
};

function pageRange(start: number, end: number) {
  const length = end - start + 1;
  return Array.from({ length }, (_, index) => start + index);
}

function visibleRange(
  currentPage: number,
  totalPages: number,
  itemsToDisplay: number,
  showLeftEllipsis: boolean,
  showRightEllipsis: boolean
) {
  const halfDisplay = Math.floor(itemsToDisplay / 2);
  let start = Math.max(1, currentPage - halfDisplay);
  let end = Math.min(totalPages, currentPage + halfDisplay);

  if (start === 1) {
    end = itemsToDisplay;
  }
  if (end === totalPages) {
    start = totalPages - itemsToDisplay + 1;
  }
  if (showLeftEllipsis) {
    start += 1;
  }
  if (showRightEllipsis) {
    end -= 1;
  }
  return pageRange(start, end);
}

export function usePagination({
  currentPage,
  totalPages,
  paginationItemsToDisplay,
}: UsePaginationProps): UsePaginationReturn {
  const halfOfItems = paginationItemsToDisplay / 2;
  const pagesBefore = currentPage - 1;
  const pagesAfter = totalPages - currentPage + 1;
  const showLeftEllipsis = pagesBefore > halfOfItems;
  const showRightEllipsis = pagesAfter > halfOfItems;
  const fitsWithoutEllipsis = totalPages <= paginationItemsToDisplay;

  if (fitsWithoutEllipsis) {
    return {
      pages: pageRange(1, totalPages),
      showLeftEllipsis,
      showRightEllipsis,
    };
  }

  const pages = visibleRange(
    currentPage,
    totalPages,
    paginationItemsToDisplay,
    showLeftEllipsis,
    showRightEllipsis
  );

  return { pages, showLeftEllipsis, showRightEllipsis };
}
