import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import { Globe, ShieldAlert, Archive, Eye, RotateCcw } from 'lucide-react';

const PublishingTable = ({
  data = [],
  onPublish,
  onUnpublish,
  onArchive,
  onUnarchive,
  canUnarchive = false,
}) => {
  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: (info) => {
          const bookId = info.row.original.book_id;
          return (
            <div className="max-w-[150px] sm:max-w-xs text-left">
              <Link
                to={`/dashboard/books/${bookId}`}
                className="font-bold text-[var(--color-ink)] hover:text-[var(--color-archive-green)] block truncate transition-colors"
              >
                {info.getValue() || 'Untitled'}
              </Link>
              <span className="text-[10px] text-[var(--color-subtle-ink)] font-mono mt-0.5 block">Slug: {info.row.original.slug}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'author',
        header: 'Author',
        cell: (info) => <span className="text-[var(--color-ink-soft)] whitespace-nowrap text-xs text-left block">{info.getValue() || 'N/A'}</span>,
      },
      {
        accessorKey: 'text_status',
        header: 'Text Review',
        cell: (info) => <div className="text-left"><StatusBadge status={info.getValue()} /></div>,
      },
      {
        accessorKey: 'cover_status',
        header: 'Cover Review',
        cell: (info) => <div className="text-left"><StatusBadge status={info.getValue()} /></div>,
      },
      {
        accessorKey: 'rights_status',
        header: 'Rights Review',
        cell: (info) => <div className="text-left"><StatusBadge status={info.getValue()} /></div>,
      },
      {
        accessorKey: 'publication_status',
        header: 'Pub Status',
        cell: (info) => <div className="text-left"><StatusBadge status={info.getValue()} /></div>,
      },
      {
        accessorKey: 'public_url',
        header: 'Public URL',
        cell: (info) => {
          const url = info.getValue();
          return url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-[var(--color-archive-green)] hover:underline block truncate max-w-[150px] text-left"
            >
              {url}
            </a>
          ) : (
            <span className="text-[var(--color-subtle-ink)] text-xs italic text-left block">Unpublished</span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const book = info.row.original;
          const bookId = book.book_id;
          const pubStatus = String(book.publication_status || '').toLowerCase();
          const isPublished = pubStatus === 'published';

          const textApproved = String(book.text_status).toLowerCase() === 'approved';
          const coverApproved = String(book.cover_status).toLowerCase() === 'approved';
          const rightsVerified = String(book.rights_status).toLowerCase() === 'verified' || String(book.rights_status).toLowerCase() === 'approved';
          const canPublish = textApproved && coverApproved && rightsVerified && !isPublished && pubStatus !== 'archived';

          return (
            <div className="flex items-center gap-1.5 justify-end">
              <Link to={`/dashboard/books/${bookId}`} title="Open Details">
                <Button variant="ghost" size="sm" className="p-1 h-7 w-7 rounded-lg hover:bg-[var(--color-panel)] transition-all">
                  <Eye className="w-3.5 h-3.5 text-[var(--color-muted-ink)]" />
                </Button>
              </Link>

              {canPublish && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-7 w-7 rounded-lg hover:bg-[var(--color-panel)] transition-all"
                  onClick={() => onPublish(book)}
                  title="Publish Book"
                >
                  <Globe className="w-3.5 h-3.5 text-[var(--color-success)]" />
                </Button>
              )}

              {isPublished && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-7 w-7 rounded-lg hover:bg-[var(--color-panel)] transition-all"
                  onClick={() => onUnpublish(bookId)}
                  title="Unpublish Book"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-[var(--color-warning)]" />
                </Button>
              )}

              {pubStatus !== 'archived' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-7 w-7 rounded-lg hover:bg-[var(--color-panel)] transition-all"
                  onClick={() => onArchive(bookId)}
                  title="Archive Book"
                >
                  <Archive className="w-3.5 h-3.5 text-[var(--color-danger)]" />
                </Button>
              )}

              {pubStatus === 'archived' && canUnarchive && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-7 w-7 rounded-lg hover:bg-[var(--color-panel)] transition-all"
                  onClick={() => onUnarchive(bookId)}
                  title="Unarchive Book"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[var(--color-success)]" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [onPublish, onUnpublish, onArchive, onUnarchive, canUnarchive]
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

export default PublishingTable;
