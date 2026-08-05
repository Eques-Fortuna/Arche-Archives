import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ShieldAlert, Check, X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Card from '../ui/Card';
import ConfirmDialog from '../ui/ConfirmDialog';
import { canReviewRights } from '../../lib/auth';

/**
 * Reusable rights verification form component with sign-off validations
 */
const RightsReviewForm = ({ book, currentUser, onAction, isPending }) => {
  const canReview = canReviewRights(currentUser);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject'
  const [rejectNotes, setRejectNotes] = useState('');

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      source_name: book.source_name || '',
      source_url: book.source_url || '',
      original_publication_year: book.original_publication_year || '',
      public_domain_status: 'verified',
      public_domain_reason: book.public_domain_reason || '',
      rights_notes: book.rights_notes || '',
      jurisdiction_notes: book.jurisdiction_notes || '',
      sign_off: false,
    },
  });

  const handleTriggerAction = (type) => {
    if (type === 'reject' && !rejectNotes.trim()) {
      toast.error('Rejection comments / notes are required to explain why rights were rejected.');
      return;
    }
    setConfirmAction(type);
  };

  const handleConfirm = () => {
    const reviewerInfo = {
      reviewer_name: currentUser?.name || 'Staff Reviewer',
      reviewer_email: currentUser?.email || '',
    };

    if (confirmAction === 'approve') {
      const formValues = getValues();
      const payload = {
        ...formValues,
        original_publication_year: formValues.original_publication_year ? parseInt(formValues.original_publication_year, 10) : null,
        ...reviewerInfo,
      };
      onAction(book.book_id, 'approve', payload);
    } else if (confirmAction === 'reject') {
      const payload = {
        notes: rejectNotes,
        ...reviewerInfo,
      };
      onAction(book.book_id, 'reject', payload);
    }
    setConfirmAction(null);
  };

  return (
    <Card className="p-6">
      <div className="space-y-6 text-left font-sans">
        {/* Header */}
        <div className="flex justify-between items-start gap-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <h4 className="text-lg font-bold text-[var(--color-ink)] font-serif">{book.title}</h4>
            <p className="text-xs text-[var(--color-muted-ink)] mt-1">Author: {book.author}</p>
          </div>
          <span className="text-[10px] text-[var(--color-subtle-ink)] font-mono font-bold">ID: {book.book_id}</span>
        </div>

        {/* Warning Alert */}
        <div className="p-4 rounded-xl bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/25 text-xs text-[var(--color-danger)] flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block uppercase tracking-widest text-[9px]">Rights Clearance Block Lock</span>
            <p className="leading-relaxed font-serif">
              Publishing is blocked for this book unless the intellectual property rights status is verified.
            </p>
          </div>
        </div>

        {/* Form Inputs Grid */}
        <form onSubmit={handleSubmit(() => handleTriggerAction('approve'))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Source Name"
              placeholder="e.g. Project Gutenberg"
              disabled={!canReview}
              {...register('source_name', { required: 'Source name is required' })}
              error={errors.source_name?.message}
            />

            <Input
              label="Source URL"
              placeholder="e.g. https://gutenberg.org/..."
              disabled={!canReview}
              {...register('source_url', { 
                required: 'Source URL is required',
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Must be a valid URL starting with http/https',
                }
              })}
              error={errors.source_url?.message}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Original Publication Year"
              type="number"
              placeholder="e.g. 1879"
              disabled={!canReview}
              {...register('original_publication_year')}
            />

            <Select
              label="Public Domain Status"
              options={[{ value: 'verified', label: 'Verified' }]}
              disabled={!canReview}
              {...register('public_domain_status')}
            />
          </div>

          <Textarea
            label="Public Domain Reason"
            placeholder="Explain why this book fits into the public domain (e.g. author died > 70 years ago)..."
            disabled={!canReview}
            {...register('public_domain_reason', { required: 'Public domain explanation is required' })}
            error={errors.public_domain_reason?.message}
            rows={2}
          />

          <Textarea
            label="Rights Clearance Notes"
            placeholder="Document copyright audits or license check details..."
            disabled={!canReview}
            {...register('rights_notes', { required: 'Clearance notes are required' })}
            error={errors.rights_notes?.message}
            rows={2}
          />

          <Textarea
            label="Jurisdiction Notes"
            placeholder="e.g. Valid in the United States..."
            disabled={!canReview}
            {...register('jurisdiction_notes')}
            rows={2}
          />

          {!canReview ? (
            <div className="pt-4 border-t border-[var(--color-border)] text-center py-4 space-y-2">
              <div className="p-3 bg-[var(--color-danger-soft)]/20 border border-[var(--color-danger)]/15 text-[var(--color-danger)] rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Read-only: Rights clearance audits are restricted.</span>
              </div>
            </div>
          ) : (
            <>
              {/* Sign-off checklist checkbox */}
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--color-panel)] border border-[var(--color-border)]">
                  <input
                    type="checkbox"
                    id="sign_off"
                    {...register('sign_off', { required: 'You must sign off to approve rights' })}
                    className="w-4 h-4 text-[var(--color-archive-green)] border-[var(--color-border)] rounded focus:ring-[var(--color-archive-green)]/20 cursor-pointer"
                  />
                  <label htmlFor="sign_off" className="text-xs text-[var(--color-ink-soft)] cursor-pointer select-none">
                    I hereby sign off and verify that this book's content resides in the public domain and is cleared for release.
                  </label>
                </div>
                {errors.sign_off && (
                  <span className="text-[10px] text-[var(--color-danger)] block mt-0.5 px-1">{errors.sign_off.message}</span>
                )}
              </div>

              {/* Rejection comments box */}
              <div className="pt-4 border-t border-[var(--color-border)] space-y-2">
                <Textarea
                  label="Rejection Reason"
                  placeholder="Provide details if rejecting rights..."
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Action triggers */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <Button
                  variant="danger"
                  type="button"
                  disabled={isPending}
                  onClick={() => handleTriggerAction('reject')}
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Reject Rights
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isPending}
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Verify & Approve Rights
                </Button>
              </div>
            </>
          )}
        </form>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={`${confirmAction ? confirmAction.toUpperCase() : ''} Rights Status`}
        message={`Are you sure you want to verify and record this ${confirmAction} decision?`}
        confirmText="Confirm Action"
        confirmVariant={confirmAction === 'reject' ? 'danger' : 'primary'}
        isLoading={isPending}
      />
    </Card>
  );
};

export default RightsReviewForm;
