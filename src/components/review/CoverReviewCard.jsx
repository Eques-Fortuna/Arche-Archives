import React, { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X, RefreshCw, Upload, Loader2, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import ConfirmDialog from '../ui/ConfirmDialog';
import Card from '../ui/Card';
import CoverOptionGrid from './CoverOptionGrid';
import { requestHumanCoverUploadUrl, submitHumanCover } from '../../lib/api';

/**
 * Reusable Card component for Cover review queue items supporting candidates selection and custom uploads
 */
const CoverReviewCard = ({ book, currentUser, onAction, isPending }) => {
  const queryClient = useQueryClient();
  
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedPath, setSelectedPath] = useState('');
  const [notes, setNotes] = useState('');
  
  // Custom cover upload states
  const [isUploadingHuman, setIsUploadingHuman] = useState(false);
  const [humanFile, setHumanFile] = useState(null);

  // Confirmation modals
  const [confirmType, setConfirmType] = useState(null); // 'approve' | 'reject'

  const handleSelectOption = (optionNumber, path) => {
    setSelectedOption(optionNumber);
    // Determine approved path based on option path or slug
    const optionFilename = path ? path.split('/').pop() : `option_${optionNumber}.jpg`;
    const bookSlug = book.slug || 'unknown-book';
    setSelectedPath(`covers/approved/${bookSlug}/${optionFilename}`);
    
    // Immediately open confirmation trigger for approval
    setConfirmType('approve');
  };

  const handleTriggerAction = (type) => {
    if (type === 'reject' && !notes.trim()) {
      toast.error('Notes are required to explain the rejection and prompt cover option regenerations.');
      return;
    }
    setConfirmType(type);
  };

  const handleConfirm = () => {
    const payload = {
      reviewer_name: currentUser?.name || 'Staff Reviewer',
      reviewer_email: currentUser?.email || '',
      notes: notes || `Approved cover Option ${selectedOption}`,
    };

    if (confirmType === 'approve') {
      payload.approved_option = selectedOption;
      payload.approved_cover_path = selectedPath;
    } else if (confirmType === 'reject') {
      payload.recovery_action = 'Regenerate cover options.';
    }

    onAction(book.book_id, confirmType, payload);
    setConfirmType(null);
  };

  const handleHumanCoverUpload = async (file) => {
    if (!file) return;
    setIsUploadingHuman(true);
    const toastId = toast.loading('Uploading custom human designed cover file...');
    try {
      // 1. Fetch S3 signed upload URL
      const { upload_url, storage_path } = await requestHumanCoverUploadUrl(book.book_id || book.id, {
        file_name: file.name,
        content_type: file.type || 'image/png'
      });

      // 2. Upload directly to S3 / DigitalOcean
      toast.loading('Uploading file directly to storage...', { id: toastId });
      await axios.put(upload_url, file, {
        headers: {
          'Content-Type': file.type || 'image/png'
        }
      });

      // 3. Override Cover Design on pipeline
      toast.loading('Applying cover override to pipeline...', { id: toastId });
      await submitHumanCover(book.book_id || book.id, {
        approved_cover_path: storage_path,
        reviewer_name: currentUser?.name || 'Staff Reviewer',
        reviewer_email: currentUser?.email || '',
        notes: notes || 'Custom direct human cover design upload'
      });

      toast.success('Human-designed cover applied successfully!', { id: toastId });
      queryClient.invalidateQueries({ queryKey: ['coverReviewQueue'] });
      setNotes('');
      setHumanFile(null);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Failed to complete human cover override upload.', { id: toastId });
    } finally {
      setIsUploadingHuman(false);
    }
  };

  const options = book.cover_options || [
    { id: 1, option_number: 1, storage_path: `covers/candidates/${book.slug || 'slug'}/option_1.jpg` },
    { id: 2, option_number: 2, storage_path: `covers/candidates/${book.slug || 'slug'}/option_2.jpg` },
    { id: 3, option_number: 3, storage_path: `covers/candidates/${book.slug || 'slug'}/option_3.jpg` },
  ];

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 pb-4 border-b border-white/5">
        <div>
          <h4 className="text-lg font-bold text-white">{book.title}</h4>
          <p className="text-xs text-slate-400 mt-1">Author: {book.author}</p>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">ID: {book.book_id}</span>
      </div>

      {/* Synopsis */}
      {book.description && (
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{book.description}</p>
      )}

      {/* Prompt / Style Notes */}
      {book.cover_prompt && (
        <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-1">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Generation Prompt / Style</span>
          <p className="text-xs text-slate-300 font-mono">{book.cover_prompt}</p>
        </div>
      )}

      {/* Carousel Candidates */}
      <div className="space-y-3">
        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Generated Cover Candidates</span>
        <CoverOptionGrid
          book={book}
          options={options}
          selectedOption={selectedOption}
          onSelect={handleSelectOption}
        />
      </div>

      {/* Drag & Drop Override for human-designed covers */}
      <div className="space-y-2 pt-2">
        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Override with Human-Designed Cover</span>
        <div className="relative border border-dashed border-white/10 hover:border-cyan-500/30 rounded-2xl p-6 transition-all bg-slate-950 flex flex-col items-center justify-center gap-2 cursor-pointer group">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleHumanCoverUpload(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploadingHuman}
          />
          {isUploadingHuman ? (
            <div className="text-center space-y-2">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <span className="text-xs text-slate-400">Uploading override cover design...</span>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              <span className="text-sm font-medium text-slate-300">
                Drag and drop human design cover image or click to select
              </span>
              <span className="text-xs text-slate-500">Supports PNG, JPG, JPEG</span>
            </>
          )}
        </div>
      </div>

      {/* Notes Form */}
      <div className="space-y-2">
        <Textarea
          label="Rejection Comments / Notes"
          placeholder="Provide audit comments if rejecting cover options..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Decision Triggers */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
        <Button
          variant="danger"
          disabled={isPending || isUploadingHuman}
          onClick={() => handleTriggerAction('reject')}
          className="w-full sm:w-auto"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Reject & Regenerate Options
        </Button>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmType !== null}
        onClose={() => setConfirmType(null)}
        onConfirm={handleConfirm}
        title={`${confirmType ? confirmType.toUpperCase() : ''} Cover Decision`}
        message={`Are you sure you want to execute this cover review ${confirmType} action?`}
        confirmText="Confirm Decision"
        confirmVariant={confirmType === 'reject' ? 'danger' : 'primary'}
        isLoading={isPending}
      />
    </Card>
  );
};

export default CoverReviewCard;
