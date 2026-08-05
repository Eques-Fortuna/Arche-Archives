import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { deleteBookPermanently } from '../../lib/api';

const DeleteBookModal = ({ isOpen, onClose, book, onSuccess }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);

  const bookId = book?.book_id || book?.id;
  const isConfirmed = confirmInput.trim() === 'DELETE_BOOK';

  const handleDelete = async () => {
    if (!isConfirmed || !bookId) return;

    setIsDeleting(true);
    setErrorDetails(null);
    const toastId = toast.loading('Permanently deleting book and storage objects...');

    try {
      const res = await deleteBookPermanently(bookId);
      toast.success('Book deleted permanently.', { id: toastId });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['adminBooks'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['publishingList'] });
      queryClient.invalidateQueries({ queryKey: ['adminBooksPublishing'] });
      queryClient.invalidateQueries({ queryKey: ['adminTextQueue'] });
      queryClient.invalidateQueries({ queryKey: ['adminCoverQueue'] });
      queryClient.invalidateQueries({ queryKey: ['adminRightsQueue'] });
      queryClient.invalidateQueries({ queryKey: ['adminRecovery'] });

      setConfirmInput('');
      onClose();

      if (onSuccess) {
        onSuccess(res);
      } else {
        navigate('/dashboard/books');
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(err);
      }
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to delete book permanently.';
      const details = err.response?.data?.details || err.response?.data?.storage_errors;
      
      if (details) {
        setErrorDetails(Array.isArray(details) ? details.join(', ') : String(details));
      }
      
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmInput('');
    setErrorDetails(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Permanently delete this book?" maxWidth="max-w-md">
      <div className="space-y-5">
        <div className="p-4 rounded-xl bg-[#8A2D3B]/10 border border-[#8A2D3B]/20 text-[#8A2D3B] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#8A2D3B]" />
          <div className="text-xs space-y-1">
            <span className="font-bold uppercase tracking-wider block">Warning: Irreversible Action</span>
            <p className="leading-relaxed">
              This will delete the book, all database records, generated files, cover images, data chunks, and DigitalOcean storage objects. This cannot be undone.
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Book Title</h4>
          <p className="text-sm font-semibold text-white">{book?.title || 'Selected Book'}</p>
          {bookId && <p className="text-[10px] text-slate-500 font-mono">ID: {bookId}</p>}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            To confirm deletion, please type <span className="font-mono font-bold text-rose-400">DELETE_BOOK</span> below:
          </label>
          <Input
            type="text"
            placeholder="DELETE_BOOK"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            disabled={isDeleting}
            className="font-mono text-sm"
          />
        </div>

        {errorDetails && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 font-mono">
            <strong>Storage Error Details:</strong> {errorDetails}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={isDeleting} size="sm">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            size="sm"
            className="min-w-[150px]"
          >
            {isDeleting ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Deleting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" />
                Delete Permanently
              </span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteBookModal;
