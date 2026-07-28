import React, { useState } from 'react';
import { getFileSignedUrl } from '../../lib/api';
import toast from 'react-hot-toast';
import { File, Eye, Download, Loader2 } from 'lucide-react';
import { formatDate } from '../../lib/formatters';
import Button from '../ui/Button';

/**
 * Reusable Files table for displaying book artifacts with secure links
 */
const BookFilesTable = ({ bookId, files = [] }) => {
  const [loadingFileId, setLoadingFileId] = useState(null);

  const isHtmlFile = (file) => {
    const mime = String(file.mime_type || '').toLowerCase();
    const type = String(file.file_type || '').toLowerCase();
    const path = String(file.storage_path || '').toLowerCase();
    return mime === 'text/html' || type === 'html' || type === 'html_source' || path.endsWith('.html') || path.endsWith('.htm');
  };

  const displayFileType = (type) => {
    const lowerType = String(type).toLowerCase();
    if (lowerType === 'html_source' || lowerType === 'html') {
      return 'HTML Source';
    }
    return String(type).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const handleFetchAndOpen = async (fileId) => {
    setLoadingFileId(fileId);
    toast.loading('Generating secure link...');
    try {
      const data = await getFileSignedUrl(bookId, fileId);
      toast.dismiss();
      if (data && data.url) {
        window.open(data.url, '_blank');
        toast.success('Secure link generated!');
      } else {
        toast.error('Failed to resolve signed URL from backend.');
      }
    } catch (e) {
      toast.dismiss();
      toast.error('Error fetching secure URL.');
    } finally {
      setLoadingFileId(null);
    }
  };

  return (
    <div className="overflow-x-auto w-full text-left">
      <table className="w-full text-sm text-[var(--color-ink)] border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-panel)]">
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-muted-ink)]">File Type</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-muted-ink)]">Storage Path</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-muted-ink)]">MIME Type</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-muted-ink)]">Created At</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-muted-ink)] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {files.length > 0 ? (
            files.map((file, i) => (
              <tr key={file.file_id || file.id || i} className="hover:bg-[var(--color-panel)]/30 transition-colors">
                <td className="px-6 py-4 align-middle font-bold text-[var(--color-ink)]">
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-[var(--color-archive-green)]" />
                    <span>{displayFileType(file.file_type)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 align-middle font-mono text-xs text-[var(--color-muted-ink)] truncate max-w-[200px]" title={file.storage_path}>
                  {file.storage_path}
                </td>
                <td className="px-6 py-4 align-middle text-xs text-[var(--color-muted-ink)] font-mono">{file.mime_type || 'application/octet-stream'}</td>
                <td className="px-6 py-4 align-middle text-xs text-[var(--color-muted-ink)]">{formatDate(file.created_at)}</td>
                <td className="px-6 py-4 align-middle text-right">
                  <div className="flex justify-end gap-2">
                    {isHtmlFile(file) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingFileId !== null}
                        onClick={() => handleFetchAndOpen(file.file_id || file.id)}
                      >
                        {loadingFileId === (file.file_id || file.id) ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        ) : (
                          <Download className="w-3.5 h-3.5 mr-1" />
                        )}
                        Download Source
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingFileId !== null}
                        onClick={() => handleFetchAndOpen(file.file_id || file.id)}
                      >
                        {loadingFileId === (file.file_id || file.id) ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 mr-1" />
                        )}
                        Preview
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={loadingFileId !== null}
                      onClick={() => handleFetchAndOpen(file.file_id || file.id)}
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Download
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center py-12 text-[var(--color-subtle-ink)] italic">
                No storage artifacts registered for this book record.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BookFilesTable;
