import React, { useState } from 'react';
import { getFileSignedUrl } from '../../lib/api';
import toast from 'react-hot-toast';
import { FileText, Download, Check, X, Edit3, Loader2, AlertTriangle, Eye } from 'lucide-react';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import ConfirmDialog from '../ui/ConfirmDialog';
import Card from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';

/**
 * Reusable Card component for Text review queue items
 */
const TextReviewCard = ({ book, currentUser, onAction, isPending }) => {
  const [notes, setNotes] = useState('');
  const [loadingType, setLoadingType] = useState(null);
  
  // Confirmation state
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject' | 'needs_changes'

  const handleOpenLink = async (fileType) => {
    const file = book.files?.find(f => String(f.file_type).toLowerCase() === fileType.toLowerCase());
    if (!file) {
      toast.error(`No ${fileType.toUpperCase()} file artifact registered.`);
      return;
    }

    setLoadingType(fileType);
    toast.loading(`Retrieving secure ${fileType.toUpperCase()} link...`);
    try {
      const data = await getFileSignedUrl(book.book_id, file.file_id || file.id);
      toast.dismiss();
      if (data && data.url) {
        window.open(data.url, '_blank');
      } else {
        toast.error('Failed to resolve signed URL from backend.');
      }
    } catch (e) {
      toast.dismiss();
      toast.error('Error fetching secure URL.');
    } finally {
      setLoadingType(null);
    }
  };

  const handleTriggerAction = (type) => {
    if (type !== 'approve' && !notes.trim()) {
      toast.error(`Notes are required when executing a ${type.replace('_', ' ')} action.`);
      return;
    }
    setConfirmAction(type);
  };

  const handleConfirm = () => {
    const payload = {
      reviewer_name: currentUser?.name || 'Staff Reviewer',
      reviewer_email: currentUser?.email || '',
      notes: notes,
    };

    if (confirmAction === 'reject') {
      payload.recovery_action = 'Fix issues and rerun render phase.';
    }

    onAction(book.book_id, confirmAction, payload);
    setConfirmAction(null);
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start gap-4 pb-4 border-b border-white/5">
          <div>
            <h4 className="text-lg font-bold text-white">{book.title}</h4>
            <p className="text-xs text-slate-400 mt-1">
              Author: {book.author} | Type: <span className="capitalize">{book.work_type}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[10px] text-slate-500 font-mono">ID: {book.book_id}</span>
            <StatusBadge status={book.stage_status} />
          </div>
        </div>

        {/* Warnings Alert */}
        {book.last_error && (
          <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10 text-xs text-yellow-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Render Phase Warnings / Log</span>
              <p className="font-mono">{book.last_error}</p>
            </div>
          </div>
        )}

        {/* File Actions / Preview */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Manuscript Artifacts</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={loadingType !== null}
              onClick={() => handleOpenLink('pdf')}
            >
              {loadingType === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
              Preview PDF Edition
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={loadingType !== null}
              onClick={() => handleOpenLink('docx')}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download DOCX
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={loadingType !== null}
              onClick={() => handleOpenLink('epub')}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download EPUB
            </Button>
          </div>
        </div>

        {/* Review Notes Form */}
        <div className="space-y-2">
          <Textarea
            label="Reviewer Comments & Feedback"
            placeholder="Provide audit notes. Mandatory for Reject and Needs Changes decisions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-white/5">
          <Button
            variant="danger"
            onClick={() => handleTriggerAction('reject')}
            disabled={isPending}
          >
            <X className="w-4 h-4 mr-1.5" />
            Reject
          </Button>
          <Button
            variant="outline"
            className="border-yellow-500/30 hover:bg-yellow-500/10 hover:border-yellow-500 text-yellow-400"
            onClick={() => handleTriggerAction('needs_changes')}
            disabled={isPending}
          >
            <Edit3 className="w-4 h-4 mr-1.5" />
            Needs Changes
          </Button>
          <Button
            variant="primary"
            onClick={() => handleTriggerAction('approve')}
            disabled={isPending}
          >
            <Check className="w-4 h-4 mr-1.5" />
            Approve Composition
          </Button>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={`${confirmAction ? confirmAction.replace('_', ' ').toUpperCase() : ''} Review Decision`}
        message={`Are you sure you want to execute this ${confirmAction} audit decision?`}
        confirmText="Confirm Action"
        confirmVariant={confirmAction === 'reject' ? 'danger' : 'primary'}
        isLoading={isPending}
      />
    </Card>
  );
};

export default TextReviewCard;
