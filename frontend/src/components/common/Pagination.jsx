import React from "react";

export function Pagination({ page, totalPages, totalRecords, pageSize, onChange }) {
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalRecords);
  return (
    <div className="pagination">
      <span className="pagination-info">
        {totalRecords === 0 ? "No records" : `${from}–${to} of ${totalRecords}`}
      </span>
      <button onClick={() => onChange(0)} disabled={page === 0}>
        <span className="material-icons">first_page</span>
      </button>
      <button onClick={() => onChange(page - 1)} disabled={page === 0}>
        <span className="material-icons">chevron_left</span>
      </button>
      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
        const start = Math.max(0, Math.min(page - 2, totalPages - 5));
        const p = start + i;
        return (
          <button key={p} onClick={() => onChange(p)} className={p === page ? "active" : ""}>
            {p + 1}
          </button>
        );
      })}
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1}>
        <span className="material-icons">chevron_right</span>
      </button>
      <button onClick={() => onChange(totalPages - 1)} disabled={page >= totalPages - 1}>
        <span className="material-icons">last_page</span>
      </button>
    </div>
  );
}

export default Pagination;
