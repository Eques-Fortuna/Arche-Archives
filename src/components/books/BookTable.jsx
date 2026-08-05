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
import { Play, RotateCcw, Archive, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { canRunAutomation, canRetry, canArchive } from '../../lib/auth';

const PipelineProgressBar = ({ book }) => {
  const currentStage = String(book.current_stage || '').toLowerCase();
  const stageStatus = String(book.stage_status || '').toLowerCase();
  const textStatus = String(book.text_status || '').toLowerCase();
  const coverStatus = String(book.cover_status || '').toLowerCase();
  const rightsStatus = String(book.rights_status || '').toLowerCase();
  const pubStatus = String(book.publication_status || '').toLowerCase();

  const stages = [
    { name: 'Normalized', key: 'normalized' },
    { name: 'Structured', key: 'structured' },
    { name: 'Rendered', key: 'rendered' },
    { name: 'Text Approved', key: 'text_approved' },
    { name: 'Cover Approved', key: 'cover_approved' },
    { name: 'Assembled', key: 'assembled' },
  ];

  const getStageStatus = (stageKey) => {
    switch (stageKey) {
      case 'normalized':
        if (currentStage === 'uploaded') return 'pending';
        if (currentStage === 'normalization') {
          return stageStatus === 'failed' ? 'failed' : 'active';
        }
        return 'complete';
      case 'structured':
        if (['uploaded', 'normalization', 'normalized'].includes(currentStage)) return 'pending';
        if (currentStage === 'structure') {
          return stageStatus === 'failed' ? 'failed' : 'active';
        }
        return 'complete';
      case 'rendered':
        if (['uploaded', 'normalization', 'normalized', 'structure', 'structured'].includes(currentStage)) return 'pending';
        if (currentStage === 'rendering') {
          return stageStatus === 'failed' ? 'failed' : 'active';
        }
        return 'complete';
      case 'text_approved':
        if (textStatus === 'approved') return 'complete';
        if (textStatus === 'pending_review') return 'active';
        if (['rejected', 'needs_changes'].includes(textStatus)) return 'failed';
        return 'pending';
      case 'cover_approved':
        if (coverStatus === 'approved') return 'complete';
        if (coverStatus === 'pending_review') return 'active';
        if (['rejected', 'needs_changes'].includes(coverStatus)) return 'failed';
        return 'pending';
      case 'assembled':
        if (['assembled', 'data_packaged', 'published'].includes(currentStage) || ['assembled', 'published'].includes(pubStatus)) return 'complete';
        if (currentStage === 'assembly') {
          return stageStatus === 'failed' ? 'failed' : 'active';
        }
        return 'pending';
      default:
        return 'pending';
    }
  };

  return (
    <div className="flex items-center gap-1 justify-center sm:justify-start">
      {stages.map((st, idx) => {
        const status = getStageStatus(st.key);
        let bgColor = 'bg-[var(--color-panel-deep)] border-[var(--color-border)]';
        
        if (status === 'complete') {
          bgColor = 'bg-[var(--color-success)] border-[var(--color-success)] shadow-sm';
        } else if (status === 'active') {
          bgColor = 'bg-[var(--color-antique-gold)] border-[var(--color-antique-gold-dark)] animate-pulse';
        } else if (status === 'failed') {
          bgColor = 'bg-[var(--color-danger)] border-[var(--color-danger)]';
        }

        return (
          <div key={st.key} className="flex items-center" title={`${st.name}: ${status}`}>
            <div className={`w-3.5 h-3.5 rounded-full border ${bgColor} transition-all duration-300`} />
            {idx < stages.length - 1 && (
              <div className={`w-3 sm:w-6 h-0.5 ${status === 'complete' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-panel-deep)]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const BookTable = ({ books, onRunNextPhase, onRetry, onArchive }) => {
  const { user } = useAuth();
  const canRun = canRunAutomation(user);
  const canRet = canRetry(user);
  const canArc = canArchive(user);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Book Details',
        cell: (info) => {
          const book = info.row.original;
          const textReviewBadge = book.text_status === 'pending_review';
          const coverReviewBadge = book.cover_status === 'pending_review';
          const rightsReviewBadge = book.rights_status === 'needs_review';

          return (
            <div className="max-w-[200px] sm:max-w-xs space-y-1 text-left">
              <Link
                to={`/dashboard/books/${book.book_id}`}
                className="font-bold text-[var(--color-ink)] hover:text-[var(--color-archive-green)] block truncate transition-colors text-sm"
              >
                {info.getValue()}
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-muted-ink)] text-xs">{book.author}</span>
                <span className="text-[var(--color-subtle-ink)] font-mono text-[10px]">({book.book_id})</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {textReviewBadge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--color-antique-gold-soft)] text-[var(--color-antique-gold-dark)] border border-[var(--color-antique-gold)]/20">
                    Needs Text Review
                  </span>
                )}
                {coverReviewBadge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--color-info-soft)] text-[var(--color-info)] border border-[var(--color-info)]/20">
                    Needs Cover Choice
                  </span>
                )}
                {rightsReviewBadge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--color-danger-soft)] text-[var(--color-danger)] border border-[var(--color-danger)]/20">
                    Needs Rights Verification
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: 'pipeline_progress',
        header: 'Pipeline Progress Bar',
        cell: (info) => <PipelineProgressBar book={info.row.original} />,
      },
      {
        accessorKey: 'current_stage',
        header: 'Active Stage',
        cell: (info) => (
          <span className="capitalize font-semibold text-[var(--color-ink-soft)] text-xs text-left block">
            {String(info.getValue() || 'N/A').replace('_', ' ')}
          </span>
        ),
      },
      {
        accessorKey: 'stage_status',
        header: 'Status',
        cell: (info) => <div className="text-left"><StatusBadge status={info.getValue()} /></div>,
      },
      {
        accessorKey: 'retry_count',
        header: 'Retries',
        cell: (info) => <span className="font-mono text-[var(--color-muted-ink)] text-xs text-left block">{info.getValue() || 0}</span>,
      },
      {
        accessorKey: 'updated_at',
        header: 'Updated At',
        cell: (info) => <span className="text-xs text-[var(--color-muted-ink)] whitespace-nowrap text-left block">{formatDate(info.getValue())}</span>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const bookId = info.row.original.book_id;
          
          if (!canRun && !canRet && !canArc) {
            return (
              <div className="flex items-center gap-2">
                <Link to={`/dashboard/books/${bookId}`} title="View Details">
                  <Button variant="ghost" size="sm" className="p-1.5 h-9 w-9 rounded-xl hover:bg-[var(--color-panel)] transition-all">
                    <Eye className="w-5 h-5 text-[var(--color-muted-ink)]" />
                  </Button>
                </Link>
                <span className="text-[9px] uppercase font-bold text-[var(--color-muted-ink)] tracking-wider">
                  Read Only
                </span>
              </div>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <Link to={`/dashboard/books/${bookId}`} title="View Details">
                <Button variant="ghost" size="sm" className="p-1.5 h-9 w-9 rounded-xl hover:bg-[var(--color-panel)] transition-all">
                  <Eye className="w-5 h-5 text-[var(--color-muted-ink)]" />
                </Button>
              </Link>
              {canRun && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1.5 h-9 w-9 rounded-xl hover:bg-[var(--color-panel)] transition-all"
                  onClick={() => onRunNextPhase(bookId)}
                  title="Run Next Phase"
                >
                  <Play className="w-5 h-5 text-[var(--color-success)]" />
                </Button>
              )}
              {canRet && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1.5 h-9 w-9 rounded-xl hover:bg-[var(--color-panel)] transition-all"
                  onClick={() => onRetry(bookId)}
                  title="Retry Stage"
                >
                  <RotateCcw className="w-5 h-5 text-[var(--color-warning)]" />
                </Button>
              )}
              {canArc && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1.5 h-9 w-9 rounded-xl hover:bg-[var(--color-panel)] transition-all"
                  onClick={() => onArchive(bookId)}
                  title="Archive Book"
                >
                  <Archive className="w-5 h-5 text-[var(--color-danger)]" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [onRunNextPhase, onRetry, onArchive, user, canRun, canRet, canArc]
  );

  const table = useReactTable({
    data: books,
    columns,
    getRowId: (row, index) => String(row.book_id || row.id || index),
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
                  {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-[var(--color-panel)]/30 transition-colors">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3.5 align-middle">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BookTable;
