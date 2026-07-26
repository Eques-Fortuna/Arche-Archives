import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Save, Loader2, ShieldAlert } from 'lucide-react';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { updateBookMetadata } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { canRunAutomation } from '../../lib/auth';

/**
 * Editable / Display Metadata Form for book details view
 */
const BookMetadata = ({ book, onUpdateSuccess }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canEdit = canRunAutomation(user);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: book?.title || '',
      author: book?.author || '',
      original_publication_year: book?.original_publication_year || '',
      keywords: book?.keywords || '',
      description: book?.description || '',
      language: book?.language || 'English',
      source_name: book?.source_name || '',
      source_url: book?.source_url || '',
      public_domain_status: book?.public_domain_status || 'pending',
      public_domain_reason: book?.public_domain_reason || '',
      rights_notes: book?.rights_notes || '',
      jurisdiction_notes: book?.jurisdiction_notes || '',
    },
  });

  // Keep form values in sync with book data loads
  useEffect(() => {
    if (book) {
      reset({
        title: book.title || '',
        author: book.author || '',
        original_publication_year: book.original_publication_year || '',
        keywords: book.keywords || '',
        description: book.description || '',
        language: book.language || 'English',
        source_name: book.source_name || '',
        source_url: book.source_url || '',
        public_domain_status: book.public_domain_status || 'pending',
        public_domain_reason: book.public_domain_reason || '',
        rights_notes: book.rights_notes || '',
        jurisdiction_notes: book.jurisdiction_notes || '',
      });
    }
  }, [book, reset]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    const toastId = toast.loading('Saving metadata changes...');
    try {
      const payload = {
        title: data.title,
        author: data.author,
        description: data.description || '',
        keywords: data.keywords || '',
        language: data.language || 'English',
        original_publication_year: data.original_publication_year ? parseInt(data.original_publication_year, 10) : null,
        source_name: data.source_name || '',
        source_url: data.source_url || '',
        public_domain_status: data.public_domain_status || 'pending',
        public_domain_reason: data.public_domain_reason || '',
        rights_notes: data.rights_notes || '',
        jurisdiction_notes: data.jurisdiction_notes || '',
      };

      await updateBookMetadata(book.book_id, payload);

      // Invalidate target query cache to force immediate sync updates
      queryClient.invalidateQueries({ queryKey: ['adminBook', book.book_id] });

      toast.success('Metadata changes saved successfully!', { id: toastId });
      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to save metadata';
      toast.error(`Error: ${errorMessage}`, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Setup readable array for non-editing users
  const displayFields = [
    { label: 'Book Title', value: book?.title },
    { label: 'Book Author', value: book?.author },
    { label: 'Publication Year', value: book?.original_publication_year },
    { label: 'Language', value: book?.language },
    { label: 'Keywords', value: book?.keywords },
    { label: 'Source Name', value: book?.source_name },
    { label: 'Source URL', value: book?.source_url, isUrl: true },
    { label: 'Public Domain Status', value: book?.public_domain_status, isBadge: true },
    { label: 'Public Domain Reason', value: book?.public_domain_reason, fullWidth: true },
    { label: 'Rights Clearance Notes', value: book?.rights_notes, fullWidth: true },
    { label: 'Jurisdiction Notes', value: book?.jurisdiction_notes, fullWidth: true },
    { label: 'Description / Synopsis', value: book?.description, fullWidth: true },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
        <h3 className="text-base font-bold text-[var(--color-ink)] font-serif uppercase tracking-wider">Book Profile Metadata</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content Area */}
        {canEdit ? (
          <form onSubmit={handleSubmit(onSubmit)} className="md:col-span-2 space-y-5">
            {/* Core Metadata Segment */}
            <div className="bg-[var(--color-panel)]/30 p-4 rounded-xl border border-[var(--color-border)]/50 space-y-4">
              <span className="text-[9px] text-[var(--color-muted-ink)] font-bold uppercase tracking-widest block border-b border-[var(--color-border)]/45 pb-1">
                Core Identity
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Book Title"
                  placeholder="e.g. A Princess of Mars"
                  {...register('title', { required: 'Book title is required' })}
                  error={errors.title?.message}
                />

                <Input
                  label="Book Author"
                  placeholder="e.g. Edgar Rice Burroughs"
                  {...register('author', { required: 'Author is required' })}
                  error={errors.author?.message}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Publication Year"
                  type="number"
                  placeholder="e.g. 1912"
                  {...register('original_publication_year')}
                />

                <Input
                  label="Language"
                  placeholder="e.g. English"
                  {...register('language')}
                />

                <Input
                  label="Keywords"
                  placeholder="e.g. sci-fi, mars, classic"
                  {...register('keywords')}
                />
              </div>

              <Textarea
                label="Book Description / Synopsis"
                placeholder="Enter synopsis details..."
                {...register('description')}
                rows={3}
              />
            </div>

            {/* Intellectual Property & Rights Clearances */}
            <div className="bg-[var(--color-panel)]/30 p-4 rounded-xl border border-[var(--color-border)]/50 space-y-4">
              <span className="text-[9px] text-[var(--color-muted-ink)] font-bold uppercase tracking-widest block border-b border-[var(--color-border)]/45 pb-1">
                Rights & Verification Telemetry
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Source Name"
                  placeholder="e.g. Project Gutenberg"
                  {...register('source_name')}
                />

                <Input
                  label="Source URL"
                  placeholder="e.g. https://gutenberg.org/..."
                  {...register('source_url', {
                    pattern: {
                      value: /^(https?:\/\/.+)?$/,
                      message: 'Must be a valid URL starting with http/https'
                    }
                  })}
                  error={errors.source_url?.message}
                />

                <Select
                  label="Public Domain Status"
                  options={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'verified', label: 'Verified' },
                    { value: 'needs_review', label: 'Needs Review' }
                  ]}
                  {...register('public_domain_status')}
                />
              </div>

              <Textarea
                label="Public Domain Reason"
                placeholder="Explain why this book fits into the public domain..."
                {...register('public_domain_reason')}
                rows={2}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Textarea
                  label="Rights Clearance Notes"
                  placeholder="Document rights audits..."
                  {...register('rights_notes')}
                  rows={2}
                />

                <Textarea
                  label="Jurisdiction Notes"
                  placeholder="e.g. Valid in the United States..."
                  {...register('jurisdiction_notes')}
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Metadata
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="md:col-span-2 space-y-5">
            <div className="bg-[var(--color-panel)]/30 p-5 rounded-xl border border-[var(--color-border)]/50">
              <span className="text-[9px] text-[var(--color-muted-ink)] font-bold uppercase tracking-widest block border-b border-[var(--color-border)]/45 pb-2 mb-4">
                Archival Record Metadata
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                {displayFields.map((field, idx) => {
                  if (!field.value && field.value !== 0) return null;
                  const isFull = field.fullWidth;
                  return (
                    <div key={idx} className={`${isFull ? 'sm:col-span-2' : ''} space-y-1`}>
                      <span className="text-[9px] text-[var(--color-subtle-ink)] font-bold uppercase tracking-widest block">
                        {field.label}
                      </span>
                      {field.isUrl ? (
                        <a
                          href={field.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-[var(--color-archive-green)] hover:underline truncate block"
                        >
                          {field.value}
                        </a>
                      ) : field.isBadge ? (
                        <span className="inline-block mt-0.5 px-2 py-0.5 bg-[var(--color-panel)] border border-[var(--color-border)] text-[9px] font-sans font-bold uppercase tracking-wider rounded text-[var(--color-ink)]">
                          {field.value}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--color-ink)] block leading-relaxed font-serif whitespace-pre-line">
                          {field.value}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 p-3 bg-[var(--color-danger-soft)]/20 border border-[var(--color-danger)]/15 text-[var(--color-danger)] rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Read-only: Metadata modifications are restricted to operators and administrators.</span>
              </div>
            </div>
          </div>
        )}

        {/* Read-only Statistics / Metadata Sidebar */}
        <div className="md:col-span-1 space-y-4 bg-[var(--color-panel)]/40 p-5 rounded-2xl border border-[var(--color-border)] h-fit">
          <h4 className="text-xs font-bold text-[var(--color-archive-green)] uppercase tracking-wider border-b border-[var(--color-border)] pb-2">
            System Telemetry
          </h4>
          
          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-[var(--color-subtle-ink)] font-bold uppercase tracking-widest text-[9px] block">Platform URL Slug</span>
              <span className="text-[var(--color-ink)] font-mono select-all mt-0.5 block truncate" title={book?.slug}>
                {book?.slug || 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-[var(--color-subtle-ink)] font-bold uppercase tracking-widest text-[9px] block">Book ID</span>
              <span className="text-[var(--color-ink)] font-mono select-all mt-0.5 block">
                {book?.book_id || 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-[var(--color-subtle-ink)] font-bold uppercase tracking-widest text-[9px] block">Work Type / Category</span>
              <span className="text-[var(--color-ink)] font-bold capitalize mt-0.5 block">
                {book?.work_type || 'Fiction'}
              </span>
            </div>

            <div>
              <span className="text-[var(--color-subtle-ink)] font-bold uppercase tracking-widest text-[9px] block">Word Count</span>
              <span className="text-[var(--color-ink)] font-bold mt-0.5 block">
                {book?.word_count ? book.word_count.toLocaleString() : 'N/A'} words
              </span>
            </div>

            <div>
              <span className="text-[var(--color-subtle-ink)] font-bold uppercase tracking-widest text-[9px] block">Est. Reading Time</span>
              <span className="text-[var(--color-ink)] font-bold mt-0.5 block">
                {book?.estimated_reading_time ? `${book.estimated_reading_time} mins` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookMetadata;
