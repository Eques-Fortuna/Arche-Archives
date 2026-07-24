import React, { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Upload } from 'lucide-react';
import { getPresignedUploadUrl, registerBook } from '../../lib/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const UploadBookModal = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [slug, setSlug] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    setSlug(slugify(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a book file (.txt or .epub) to upload.');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Initiating upload to DigitalOcean...');

    try {
      // 1. Get presigned upload URL
      const { url, key } = await getPresignedUploadUrl({
        file_name: file.name,
        content_type: file.type || 'text/plain'
      });

      // 2. Upload file directly to S3/DigitalOcean
      toast.loading('Uploading file directly to storage...', { id: toastId });
      await axios.put(url, file, {
        headers: {
          'Content-Type': file.type || 'text/plain'
        }
      });

      // 3. Register book in database & trigger Phase 1
      toast.loading('Registering book metadata and queueing ingestion...', { id: toastId });
      await registerBook({
        title,
        author,
        slug,
        raw_source_path: key
      });

      toast.success('Book uploaded & normalization pipeline started!', { id: toastId });
      
      // Reset form
      setTitle('');
      setAuthor('');
      setSlug('');
      setFile(null);
      
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || 'Failed to complete upload.', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register New Book" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-xs text-slate-400">
          Add a new raw book format text/epub to the platform. The pipeline will automatically normalize and structure the book.
        </p>

        <Input
          label="Book Title"
          placeholder="e.g. The Great Gatsby"
          value={title}
          onChange={handleTitleChange}
          required
          disabled={isUploading}
        />

        <Input
          label="Book Author"
          placeholder="e.g. F. Scott Fitzgerald"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
          disabled={isUploading}
        />

        <Input
          label="URL Slug path"
          placeholder="e.g. the-great-gatsby"
          value={slug}
          onChange={(e) => setSlug(slugify(e.target.value))}
          required
          disabled={isUploading}
        />

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Book File (.txt, .epub)</label>
          <div className="relative border border-dashed border-white/10 hover:border-cyan-500/30 rounded-2xl p-6 transition-all bg-slate-950 flex flex-col items-center justify-center gap-2 cursor-pointer group">
            <input
              type="file"
              accept=".txt,.epub"
              onChange={(e) => setFile(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <Upload className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            <span className="text-sm font-medium text-slate-300">
              {file ? file.name : 'Select file or drag here'}
            </span>
            <span className="text-xs text-slate-500">
              Supports .txt or .epub up to 50MB
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isUploading} size="sm">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isUploading} size="sm">
            {isUploading ? 'Uploading...' : 'Start Ingestion'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UploadBookModal;
