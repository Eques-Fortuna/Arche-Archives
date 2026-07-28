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

  const getContentType = (selectedFile) => {
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (['html', 'htm'].includes(ext)) {
      return 'text/html';
    }
    if (ext === 'txt') {
      return 'text/plain';
    }
    if (ext === 'md') {
      return 'text/markdown';
    }
    if (ext === 'epub') {
      return 'application/epub+zip';
    }
    if (ext === 'pdf') {
      return 'application/pdf';
    }
    if (ext === 'docx') {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    return selectedFile.type || 'application/octet-stream';
  };

  const validateSelectedFile = (selectedFile) => {
    const allowedExtensions = ['txt', 'md', 'html', 'htm', 'pdf', 'docx', 'epub'];
    const allowedMimeTypes = [
      'text/plain',
      'text/markdown',
      'text/html',
      'application/xhtml+xml',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/epub+zip'
    ];
    const fileName = selectedFile.name || '';
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    const isDoubleExe = fileName.toLowerCase().endsWith('.exe') || fileName.toLowerCase().includes('.html.exe') || fileName.toLowerCase().includes('.htm.exe');
    const isAllowedExt = allowedExtensions.includes(fileExtension);
    let isAllowedMime = allowedMimeTypes.includes(selectedFile.type);
    if (selectedFile.type === 'application/octet-stream' && ['html', 'htm'].includes(fileExtension)) {
      isAllowedMime = true;
    }
    if (!selectedFile.type && isAllowedExt) {
      isAllowedMime = true;
    }

    if (isDoubleExe || !isAllowedExt || !isAllowedMime) {
      toast.error('Unsupported file type. Supported source files: TXT, Markdown, HTML, PDF, DOCX, EPUB');
      return false;
    }

    const maxSize = 50 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error('File size exceeds the 50MB limit.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a book file (.txt, .md, .html, .htm, .pdf, .docx, or .epub) to upload.');
      return;
    }

    if (!validateSelectedFile(file)) {
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Initiating upload to DigitalOcean...');

    try {
      const inferredContentType = getContentType(file);
      // 1. Get presigned upload URL
      const { url, key, contentType } = await getPresignedUploadUrl({
        file_name: file.name,
        content_type: inferredContentType
      });

      // 2. Upload file directly to S3/DigitalOcean
      toast.loading('Uploading file directly to storage...', { id: toastId });
      await axios.put(url, file, {
        headers: {
          'Content-Type': contentType || inferredContentType
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
          Add a new raw book format (.txt, .md, .html, .htm, .pdf, .docx, or .epub) to the platform. The pipeline will automatically normalize and structure the book.
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
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Book File (.txt, .md, .html, .htm, .pdf, .docx, .epub)</label>
          <div className="relative border border-dashed border-white/10 hover:border-cyan-500/30 rounded-2xl p-6 transition-all bg-slate-950 flex flex-col items-center justify-center gap-2 cursor-pointer group">
            <input
              type="file"
              accept=".txt,.md,.html,.htm,.pdf,.docx,.epub,text/plain,text/markdown,text/html,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/epub+zip"
              onChange={(e) => {
                const selectedFile = e.target.files[0];
                if (selectedFile) {
                  if (validateSelectedFile(selectedFile)) {
                    setFile(selectedFile);
                  } else {
                    e.target.value = '';
                    setFile(null);
                  }
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <Upload className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            <span className="text-sm font-medium text-slate-300">
              {file ? file.name : 'Select file or drag here'}
            </span>
            <span className="text-xs text-slate-500">
              Supports .txt, .md, .html, .htm, .pdf, .docx, or .epub up to 50MB
            </span>
          </div>
          <p className="text-[10px] text-yellow-500/80 leading-normal">
            HTML files are accepted as source files. Scripts and styling will be treated as untrusted source content during processing.
          </p>
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
