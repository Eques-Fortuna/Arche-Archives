import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import { formatDate } from '../../lib/formatters';
import { Eye, CheckSquare, Play, ShieldAlert } from 'lucide-react';

const RecoveryTable = ({
  data = [],
  selectedBookId,
  onSelect,
  onMarkReady,
  onRetry,
  onBlock,
}) => {
  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Book Title',
        cell: (info) => {
          const bookId = info.row.original.book_id;
          return (
            <div className="max-w-[150px] sm:max-w-xs text-left">
              <span className="font-bold text-[var(--color-ink)] block truncate">
                {info.getValue() || 'Untitled Book'}
              </span>
              <span className="text-[10px] text-[var(--color-subtle-ink)] font-mono mt-0.5 block">ID: {bookId}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'recovery_phase',
        header: 'Phase',
        cell: (info) => <span className="capitalize text-[var(--color-ink-soft)] text-xs font-semibold text-left block">{info.getValue() || 'N/A'}</span>,
      },
      {
        accessorKey: 'recovery_status',
        header: 'Status',
        cell: (info) => <div className="text-left"><StatusBadge status={info.getValue()} /></div>,
      },
      {
        accessorKey: 'recovery_attempts',
        header: 'Attempts',
        cell: (info) => <span className="font-mono text-[var(--color-muted-ink)] text-xs text-center block">{info.getValue() || 0}</span>,
      },
      {
        accessorKey: 'retry_count',
        header: 'Retries',
        cell: (info) => <span className="font-mono text-[var(--color-muted-ink)] text-xs text-center block">{info.getValue() || 0}</span>,
      },
      {
        accessorKey: 'created_at',
        header: 'Detected',
        cell: (info) => <span className="text-xs text-[var(--color-muted-ink)] whitespace-nowrap text-left block">{formatDate(info.getValue())}</span>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const bookId = info.row.original.book_id;
          const status = String(info.row.original.recovery_status || '').toLowerCase();
          const isBlocked = status === 'blocked';

          return (
            <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
              <Link to={`/dashboard/books/${bookId}`} title="Open Details">
                <Button variant="ghost" size="sm" className="p-1 h-7 w-7 rounded-lg hover:bg-[var(--color-panel)]">
                  <Eye className="w-3.5 h-3.5 text-[var(--color-muted-ink)]" />
                </Button>
              </Link>
              
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-7 w-7 rounded-lg hover:bg-[var(--color-panel)]"
                onClick={() => onMarkReady(bookId)}
                title="Mark Ready to Retry"
              >
                <CheckSquare className="w-3.5 h-3.5 text-[var(--color-success)]" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-7 w-7 rounded-lg hover:bg-[var(--color-panel)]"
                disabled={isBlocked}
                onClick={() => onRetry(bookId)}
                title={isBlocked ? 'Retry blocked' : 'Retry Phase'}
              >
                <Play className={`w-3.5 h-3.5 ${isBlocked ? 'text-[var(--color-subtle-ink)]' : 'text-[var(--color-archive-green)]'}`} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-7 w-7 rounded-lg hover:bg-[var(--color-panel)]"
                onClick={() => onBlock(bookId)}
                title="Block Book"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-[var(--color-danger)]" />
              </Button>
            </div>
          );
        },
      },
    ],
    [onMarkReady, onRetry, onBlock]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full border-collapse text-left text-sm text-[var(--color-ink)]">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-[var(--color-border)] bg-[var(--color-panel)]">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-[var(--color-muted-ink)] whitespace-nowrap text-left"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {table.getRowModel().rows.map((row) => {
            const isSelected = selectedBookId === row.original.book_id;
            return (
              <tr
                key={row.id}
                onClick={() => onSelect(row.original.book_id)}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[var(--color-panel)] hover:bg-[var(--color-panel-deep)]'
                    : 'hover:bg-[var(--color-panel)]/30'
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3.5 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RecoveryTable;
