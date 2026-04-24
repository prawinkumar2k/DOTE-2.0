import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical,
  Check,
  Info,
  AlertCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * DataTable Component
 * 
 * Props:
 * - columns: Array of { header, accessor, render, sortable, filterable, width }
 * - data: Array of data objects
 * - isLoading: boolean
 * - onRowClick: function(row)
 * - onSelectionChange: function(selectedRows)
 * - bulkActions: ReactNode (rendered when rows are selected)
 * - stickyColumnCount: number (how many columns from the left are sticky)
 * - pageSizeOptions: Array<number>
 * - className: string
 */
const DataTable = ({
  columns = [],
  data = [],
  rowKey, // mandatory
  isLoading = false,
  onRowClick,
  onSelectionChange,
  bulkActions,
  stickyColumnCount = 0,
  pageSizeOptions = [10, 25, 50, 100],
  emptyMessage = "No results found",
  showToolbar = true,
  showPagination = true,
  showSelection = true,
  className = ""
}) => {
  // --- State ---
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showColumnFilters, setShowColumnFilters] = useState(false);

  // --- Calculations ---
  
  // 1. Filtering Logic
  const filteredData = useMemo(() => {
    return data.filter(row => {
      // Global Filter
      if (globalFilter) {
        const found = Object.entries(row).some(([key, val]) => {
          if (typeof val === 'string' || typeof val === 'number') {
            return String(val).toLowerCase().includes(globalFilter.toLowerCase());
          }
          return false;
        });
        if (!found) return false;
      }

      // Column Filters
      for (const [key, value] of Object.entries(filters)) {
        if (value && !String(row[key] || '').toLowerCase().includes(value.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [data, globalFilter, filters]);

  // 2. Sorting Logic
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredData, sortConfig]);

  // 3. Pagination Logic
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, showPagination]);

  // --- Handlers ---
  const handleSort = useCallback((key) => {
    setSortConfig(prev => {
      let direction = 'asc';
      if (prev.key === key && prev.direction === 'asc') {
        direction = 'desc';
      }
      return { key, direction };
    });
  }, []);

  const handleSelectAll = useCallback((e) => {
    if (e.target.checked) {
      const ids = new Set(paginatedData.map(row => row[rowKey]));
      setSelectedRows(ids);
    } else {
      setSelectedRows(new Set());
    }
  }, [paginatedData, rowKey]);

  const handleSelectRow = useCallback((id) => {
    setSelectedRows(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  // Effect to sync selection with parent
  useEffect(() => {
    if (onSelectionChange) {
      const selectedData = data.filter(row => selectedRows.has(row[rowKey]));
      onSelectionChange(selectedData);
    }
  }, [selectedRows, data, onSelectionChange, rowKey]);

  // Reset page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [globalFilter, filters, pageSize]);

  // --- Components ---
  
  const getStickyClass = useCallback((index) => {
    if (index < stickyColumnCount) {
      return `sticky left-0 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]`;
    }
    return "";
  }, [stickyColumnCount]);

  const getStickyHeaderClass = useCallback((index) => {
    if (index < stickyColumnCount) {
      return `sticky left-0 z-30 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`;
    }
    return "";
  }, [stickyColumnCount]);

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {/* Table Toolbar */}
      {showToolbar && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-4 bg-white border-b border-slate-100 rounded-t-2xl">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Global search..."
                className="input-field pl-10 text-sm py-2"
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowColumnFilters(!showColumnFilters)}
              className={`p-2 rounded-xl border transition-all ${showColumnFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
              title="Column Filters"
            >
              <Filter size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <AnimatePresence>
              {selectedRows.size > 0 && bulkActions && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 whitespace-nowrap">
                    {selectedRows.size} selected
                  </span>
                  {bulkActions}
                </motion.div>
              )}
            </AnimatePresence>
            
            {showPagination && (
              <div className="flex items-center gap-2 ml-auto">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Rows:</label>
                <select
                  className="bg-slate-100 border-none text-xs font-bold py-1.5 px-2 rounded-lg text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                >
                  {pageSizeOptions.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Table Area */}
      <div className="relative overflow-x-auto shadow-sm border border-slate-100 rounded-b-2xl bg-white scroll-smooth custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            {/* Header Row */}
            <tr className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              {/* Checkbox Header */}
              {showSelection && (
                <th className="px-4 py-4 w-12 sticky top-0 bg-slate-50/80 z-20">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      onChange={handleSelectAll}
                      checked={paginatedData.length > 0 && paginatedData.every(row => selectedRows.has(row[rowKey]))}
                    />
                  </div>
                </th>
              )}
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  className={`px-6 py-4 font-black whitespace-nowrap sticky top-0 bg-slate-50/80 z-10 ${getStickyHeaderClass(idx)}`}
                  style={{ width: column.width, minWidth: column.width }}
                >
                  <div 
                    className={`flex items-center gap-2 ${column.sortable ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''}`}
                    onClick={() => column.sortable && handleSort(column.accessor)}
                  >
                    {column.header}
                    {column.sortable && (
                      <div className="flex flex-col group">
                        <ChevronUp 
                          size={12} 
                          className={`-mb-0.5 ${sortConfig.key === column.accessor && sortConfig.direction === 'asc' ? 'text-blue-600' : 'text-slate-300'}`} 
                        />
                        <ChevronDown 
                          size={12} 
                          className={`-mt-0.5 ${sortConfig.key === column.accessor && sortConfig.direction === 'desc' ? 'text-blue-600' : 'text-slate-300'}`} 
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>

            {/* Column Filters Row */}
            <AnimatePresence>
              {showColumnFilters && (
                <motion.tr
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white border-b border-slate-100 overflow-hidden"
                >
                  {showSelection && <th className="px-4 py-2 bg-slate-50/30"></th>}
                  {columns.map((column, idx) => (
                    <th key={idx} className={`px-4 py-2 bg-slate-50/30 ${getStickyHeaderClass(idx)}`}>
                      {column.filterable && (
                        <input
                          type="text"
                          placeholder={`Filter...`}
                          className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none font-medium"
                          value={filters[column.accessor] || ''}
                          onChange={e => setFilters(prev => ({ ...prev, [column.accessor]: e.target.value }))}
                        />
                      )}
                    </th>
                  ))}
                </motion.tr>
              )}
            </AnimatePresence>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {showSelection && <td className="px-4 py-6 border-slate-50"><div className="w-4 h-4 bg-slate-100 rounded mx-auto"></div></td>}
                  {columns.map((_, j) => (
                    <td key={j} className="px-6 py-6 border-slate-50">
                      <div className="h-4 bg-slate-100 rounded w-full"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length + (showSelection ? 1 : 0)} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="p-4 bg-slate-50 rounded-full mb-4">
                      <AlertCircle className="text-slate-300" size={40} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{emptyMessage}</h3>
                    <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
                      Try adjusting your search or filters to find what you're looking for.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              paginatedData.map((row, rowIdx) => {
                const id = row[rowKey];
                const isSelected = selectedRows.has(id);
                
                return (
                  <motion.tr
                    layout
                    key={id}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`group transition-all hover:bg-blue-50/30 cursor-pointer ${isSelected ? 'bg-blue-50/50' : ''}`}
                  >
                    {showSelection && (
                      <td className="px-4 py-4 w-12 border-slate-50" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-transform active:scale-90 cursor-pointer"
                            checked={isSelected}
                            onChange={() => handleSelectRow(id)}
                          />
                        </div>
                      </td>
                    )}
                    {columns.map((column, colIdx) => (
                      <td
                        key={colIdx}
                        className={`px-6 py-4 text-sm font-medium border-slate-50 transition-colors ${getStickyClass(colIdx)}`}
                      >
                        {column.render 
                          ? column.render(row[column.accessor], row, rowIdx, paginatedData, currentPage, pageSize) 
                          : (row[column.accessor] || '—')}
                      </td>
                    ))}
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {showPagination && !isLoading && sortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 gap-4 bg-slate-50/50 rounded-b-2xl border border-t-0 border-slate-100">
          <p className="text-xs font-bold text-slate-500 tracking-tight">
            Showing <span className="text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * pageSize, sortedData.length)}</span> of <span className="text-slate-900">{sortedData.length}</span> results
          </p>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 disabled:bg-slate-50 transition-all hover:border-blue-300 hover:text-blue-600 shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="flex items-center gap-1 mx-2">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Only show a limited number of page buttons
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[36px] h-9 rounded-xl text-xs font-black transition-all border ${
                        currentPage === pageNum 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 || 
                  pageNum === currentPage + 2
                ) {
                  if (pageNum === currentPage - 2 && currentPage > 3) return <span key={pageNum} className="text-slate-300 px-1">...</span>;
                  if (pageNum === currentPage + 2 && currentPage < totalPages - 2) return <span key={pageNum} className="text-slate-300 px-1">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 disabled:bg-slate-50 transition-all hover:border-blue-300 hover:text-blue-600 shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
