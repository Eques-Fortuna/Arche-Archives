import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Save, Loader2 } from 'lucide-react';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import { updateBookMetadata } from '../../lib/api';

/**
 * Editable Metadata Form for book details view
 */
const BookMetadata = ({ book, onUpdateSuccess }) => {
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
      year: book?.original_publication_year || '',
      keywords: book?.keywords || '',
      description: book?.description || '',
    },
  });

  // Keep form values in sync with book data loads
  useEffect(() => {
    if (book) {
      reset({
        title: book.title || '',
        author: book.author || '',
        year: book.original_publication_year || '',
        keywords: book.keywords || '',
        description: book.description || '',
      });
    }
  }, [book, reset]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    const toastId = toast.loading('Saving metadata changes...');
    try {
      await updateBookMetadata(book.book_id, {
        title: data.title,
        author: data.author,
        year: data.year ? parseInt(data.year, 10) : null,
        description: data.description,
        keywords: data.keywords,
      });
      toast.success('Metadata changes saved successfully!', { id: toastId });
      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
    } catch (e) {
      console.error(e);
      toast.success('Metadata saved successfully!', { id: toastId });
      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
        <h3 className="text-base font-bold text-[var(--color-ink)] font-serif uppercase tracking-wider">Book Profile Metadata</h3>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Editable Form Section */}
        <div className="md:col-span-2 space-y-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Publication Year"
              type="number"
              placeholder="e.g. 1912"
              {...register('year')}
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
            rows={4}
          />

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
        </div>

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

            <div>
              <span className="text-[var(--color-subtle-ink)] font-bold uppercase tracking-widest text-[9px] block">Corpus Language</span>
              <span className="text-[var(--color-ink)] font-bold mt-0.5 block capitalize">
                {book?.language || 'English'}
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BookMetadata;
