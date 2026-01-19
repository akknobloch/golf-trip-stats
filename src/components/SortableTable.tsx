'use client'

import { useState } from 'react'
import {
  type Cell,
  type ColumnDef,
  type Row,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable
} from '@tanstack/react-table'

type SortableTableColumnMeta = {
  headerClassName?: string
  cellClassName?: string
}

type SortableTableProps<T> = {
  data: T[]
  columns: ColumnDef<T, any>[]
  tableClassName?: string
  headerRowClassName?: string
  rowClassName?: string
  headerCellClassName?: string
  cellClassName?: string
  emptyMessage?: string
  getRowClassName?: (row: Row<T>) => string
  getCellClassName?: (cell: Cell<T, unknown>) => string
}

export default function SortableTable<T>({
  data,
  columns,
  tableClassName,
  headerRowClassName,
  rowClassName,
  headerCellClassName,
  cellClassName,
  emptyMessage = 'No data available.',
  getRowClassName,
  getCellClassName
}: SortableTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  if (data.length === 0) {
    return <div className="sortable-table-empty">{emptyMessage}</div>
  }

  const tableClasses = tableClassName || 'sortable-table'
  const headerRowClasses = headerRowClassName || 'sortable-table-header-row'

  return (
    <div className={tableClasses}>
      <div className={headerRowClasses}>
        {table.getHeaderGroups().map(headerGroup => (
          headerGroup.headers.map(header => {
            if (header.isPlaceholder) return null

            const canSort = header.column.getCanSort()
            const sortState = header.column.getIsSorted()
            const headerMeta = header.column.columnDef.meta as SortableTableColumnMeta | undefined
            const headerClasses = [headerCellClassName, headerMeta?.headerClassName]
              .filter(Boolean)
              .join(' ')
            const buttonClasses = [
              'sortable-table-header-button',
              headerClasses,
              canSort ? 'sortable' : ''
            ]
              .filter(Boolean)
              .join(' ')
            const headerLabel = typeof header.column.columnDef.header === 'string'
              ? header.column.columnDef.header
              : 'column'

            return (
              <button
                key={header.id}
                type="button"
                className={buttonClasses}
                onClick={header.column.getToggleSortingHandler()}
                disabled={!canSort}
                aria-label={`Sort ${headerLabel}`}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {canSort && (
                  <span className="sort-icon" aria-hidden="true">
                    {sortState === 'asc' && <i className="fas fa-sort-up"></i>}
                    {sortState === 'desc' && <i className="fas fa-sort-down"></i>}
                    {!sortState && <i className="fas fa-sort"></i>}
                  </span>
                )}
              </button>
            )
          })
        ))}
      </div>

      {table.getRowModel().rows.map(row => {
        const rowClasses = [rowClassName, getRowClassName?.(row)]
          .filter(Boolean)
          .join(' ')

        return (
          <div key={row.id} className={rowClasses}>
            {row.getVisibleCells().map(cell => {
              const cellMeta = cell.column.columnDef.meta as SortableTableColumnMeta | undefined
              const cellClasses = [cellClassName, cellMeta?.cellClassName, getCellClassName?.(cell)]
                .filter(Boolean)
                .join(' ')

              return (
                <div key={cell.id} className={cellClasses}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
