import React from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from './dateUtils';

/**
 * Reusable Column Generators for DataTable
 */

export const getSerialNumberColumn = () => ({
  header: "#",
  accessor: "_sn",
  width: "60px",
  render: (value, row, index, paginatedData, currentPage, pageSize) => {
    // Note: index might need to be passed from DataTable or calculated
    return <span className="text-slate-400 font-mono text-xs">{(currentPage - 1) * pageSize + index + 1}</span>;
  }
});

export const getDateColumn = (header = "Date", accessor = "created_at") => ({
  header,
  accessor,
  sortable: true,
  filterable: true,
  render: (value) => <span className="text-slate-600">{formatDate(value)}</span>
});

export const getStatusColumn = (accessor = "status") => ({
  header: "Status",
  accessor,
  sortable: true,
  filterable: true,
  render: (value) => {
    const statusMap = {
      pending: "bg-amber-50 text-amber-600 border-amber-100",
      approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
      rejected: "bg-rose-50 text-rose-600 border-rose-100",
      submitted: "bg-blue-50 text-blue-600 border-blue-100",
    };
    
    const style = statusMap[value?.toLowerCase()] || "bg-slate-50 text-slate-600 border-slate-100";
    
    return (
      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${style}`}>
        {value || 'Unknown'}
      </span>
    );
  }
});

export const getActionColumn = ({ onView, onEdit, onDelete }) => ({
  header: "Actions",
  accessor: "actions",
  width: "120px",
  render: (_, row) => (
    <div className="flex items-center justify-end gap-1">
      {onView && (
        <button
          onClick={(e) => { e.stopPropagation(); onView(row); }}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
          title="View"
        >
          <Eye size={16} />
        </button>
      )}
      {onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(row); }}
          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
          title="Edit"
        >
          <Pencil size={16} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(row); }}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )
});
