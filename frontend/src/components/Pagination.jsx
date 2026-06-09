import React from 'react';

function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-2 transition-colors duration-200">
      <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
        Showing <span className="font-semibold text-zinc-900 dark:text-zinc-300">{startItem}</span> to{' '}
        <span className="font-semibold text-zinc-900 dark:text-zinc-300">{endItem}</span> of{' '}
        <span className="font-semibold text-zinc-900 dark:text-zinc-300">{totalItems}</span> challenges
      </div>

      <div className="join bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg p-0.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="join-item btn btn-xs btn-ghost text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 disabled:opacity-30 disabled:text-zinc-400 dark:disabled:text-zinc-600 px-3 cursor-pointer"
        >
          Prev
        </button>

        {pageNumbers.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`join-item btn btn-xs text-[10px] font-bold px-2.5 cursor-pointer border-none ${
              currentPage === page
                ? 'bg-cyan-100 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-200 dark:hover:bg-cyan-950/40'
                : 'btn-ghost text-zinc-550 dark:text-zinc-555 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="join-item btn btn-xs btn-ghost text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 disabled:opacity-30 disabled:text-zinc-400 dark:disabled:text-zinc-600 px-3 cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;
