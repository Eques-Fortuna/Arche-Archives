import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Upload, X, AlertCircle, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import { requestHumanCoverUploadUrl, submitHumanCover } from '../../lib/api';

const HumanCoverUploadModal = ({ isOpen, onClose, book, currentUser, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Only JPG, JPEG, PNG, and WebP images are allowed.');
      return;
    }

    // Validate size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds the 10MB limit.');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select an image file first.');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Preparing upload credentials...');

    try {
      // 1. Get presigned upload URL
      const { upload_url, storage_path } = await requestHumanCoverUploadUrl(book.book_id || book.id, {
        file_name: file.name,
        content_type: file.type
      });

      // 2. Upload file directly to S3
      toast.loading('Uploading cover file to secure storage...', { id: toastId });
      await axios.put(upload_url, file, {
        headers: {
          'Content-Type': file.type
        }
      });

      // 3. Register human cover with backend
      toast.loading('Registering cover approval...', { id: toastId });
      await submitHumanCover(book.book_id || book.id, {
        approved_cover_path: storage_path,
        reviewer_name: currentUser?.name || 'Admin',
        reviewer_email: currentUser?.email || 'admin@arche.com',
        notes: notes || 'Human-designed cover uploaded and approved.'
      });

      toast.success('Human cover uploaded and approved successfully!', { id: toastId });
      handleRemoveFile();
      setNotes('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to upload human cover.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Skip AI & Upload Human Cover" maxWidth="max-w-md">
      <div className="space-y-5">
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Book Target</h4>
          <p className="text-sm font-semibold text-white">{book?.title}</p>
        </div>

        {/* Drag / Drop Area */}
        {!file ? (
          <div className="relative border border-dashed border-white/10 hover:border-cyan-500/30 rounded-2xl p-8 transition-all bg-slate-950 flex flex-col items-center justify-center gap-2 cursor-pointer group">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            <span className="text-xs font-medium text-slate-355 text-center">
              Click or drag image file here
            </span>
            <span className="text-[10px] text-slate-500">Supports JPG, PNG, WebP up to 10MB</span>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-slate-950 p-3 flex flex-col items-center gap-3">
            <div className="relative w-full max-h-48 rounded-xl overflow-hidden bg-slate-900 flex justify-center items-center">
              <img src={previewUrl} alt="Preview" className="max-h-48 object-contain" />
              <button
                type="button"
                onClick={handleRemoveFile}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-slate-400 hover:text-white hover:bg-black/80 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full flex items-center justify-between text-xs px-1">
              <span className="text-slate-300 font-medium truncate max-w-[70%]">{file.name}</span>
              <span className="text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1">
          <Textarea
            label="Designer Review Notes"
            placeholder="Describe the cover source, notes, or licensing details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isUploading}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isUploading} size="sm">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpload} disabled={isUploading || !file} size="sm" className="min-w-[120px]">
            {isUploading ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading...
              </span>
            ) : (
              'Upload & Approve'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default HumanCoverUploadModal;
