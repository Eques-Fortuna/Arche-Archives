import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

/**
 * Reusable modal for entering and validating a public URL route prior to book publication
 */
const PublishModal = ({ isOpen, onClose, onConfirm, book, isPending }) => {
  const [publicUrl, setPublicUrl] = useState('');

  useEffect(() => {
    if (book) {
      setPublicUrl(`/books/${book.slug || ''}`);
    }
  }, [book]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanUrl = publicUrl.trim();
    if (!cleanUrl.startsWith('/books/')) {
      toast.error('The public URL path must begin with "/books/" prefix.');
      return;
    }
    onConfirm({ public_url: cleanUrl });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Publish Book Details" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-xs text-slate-400">
          Clear this book for release on the public catalog. This action registers the book route link.
        </p>

        <Input
          label="Catalog Public URL Route Path"
          placeholder="/books/my-book-slug"
          value={publicUrl}
          onChange={(e) => setPublicUrl(e.target.value)}
          required
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending} size="sm">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isPending} size="sm">
            {isPending ? 'Publishing...' : 'Approve & Release'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PublishModal;
