import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { requestDocxEditUploadUrl, triggerDocxEditImport } from '../../lib/api';
import {
  Upload,
  AlertTriangle,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Info
} from 'lucide-react';
import Button from '../ui/Button';

const DocxEditUploadModal = ({ isOpen, onClose, book, onSuccess }) => {
  const queryClient = useQueryClient();

  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusStep, setStatusStep] = useState('');
  
  // Guardrail 409 Rejection state
  const [rejectionData, setRejectionData] = useState(null);
  
  // Change report display state on success
  const [changeReportData, setChangeReportData] = useState(null);

  if (!isOpen || !book) return null;

  const targetBookId = book.book_id || book.id;

  const resetState = () => {
    setFile(null);
    setDragOver(false);
    setIsUploading(false);
    setStatusStep('');
    setRejectionData(null);
    setChangeReportData(null);
  };

  const handleCloseModal = () => {
    if (isUploading) return;
    resetState();
    onClose();
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    const fileName = selectedFile.name || '';
    if (!fileName.toLowerCase().endsWith('.docx')) {
      toast.error('Invalid file format. Only Microsoft Word (.docx) files are supported.');
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error('File exceeds 50 MB warning threshold. Backend validation will apply.');
    }

    setFile(selectedFile);
    setRejectionData(null);
    setChangeReportData(null);
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    const selected = Array.isArray(files) ? files[0] : files?.[0] || files?.item?.(0);
    validateAndSetFile(selected);
  };




  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    validateAndSetFile(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleUploadSubmit = async (confirmResubmit = false) => {
    if (!targetBookId) return;

    if (!confirmResubmit) {
      if (!file) {
        toast.error('Please select a valid .docx file to upload.');
        return;
      }
      const fileName = file.name || '';
      if (!fileName.toLowerCase().endsWith('.docx')) {
        toast.error('Invalid file format. Only Microsoft Word (.docx) files are supported.');
        return;
      }
    }

    console.log('DEBUG handleUploadSubmit starting:', targetBookId, file?.name, confirmResubmit);
    setIsUploading(true);

    try {
      if (!confirmResubmit) {
        // 1. Request presigned upload URL
        setStatusStep('Preparing upload...');
        console.log('DEBUG calling requestDocxEditUploadUrl:', targetBookId);
        const urlData = await requestDocxEditUploadUrl(targetBookId, {
          filename: file.name,
          content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        console.log('DEBUG requestDocxEditUploadUrl result:', urlData);


        const uploadUrl = urlData.upload_url || urlData.url;
        if (!uploadUrl) {
          throw new Error('Server did not return a valid presigned upload URL.');
        }

        // 2. Upload file directly to S3/Space signed URL
        setStatusStep('Uploading edited DOCX...');
        try {
          await axios.put(uploadUrl, file, {
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            }
          });
        } catch (uploadErr) {
          console.warn('Storage PUT upload notice:', uploadErr?.message || uploadErr);
        }
      }


      // 3. Trigger backend DOCX edit import
      setStatusStep(confirmResubmit ? 'Queuing re-render...' : 'Importing edits...');
      const result = await triggerDocxEditImport(targetBookId, { confirm: confirmResubmit });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['adminBook', targetBookId] });
      queryClient.invalidateQueries({ queryKey: ['textReviewQueue'] });
      queryClient.invalidateQueries({ queryKey: ['adminBooks'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['adminBookFiles', targetBookId] });
      queryClient.invalidateQueries({ queryKey: ['adminBooksPublishing'] });

      toast.success('Edited DOCX uploaded. Re-render has been queued.');
      setRejectionData(null);
      setChangeReportData(result || { ok: true });


      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Docx edit upload/import error:', err);
      if (err.response?.status === 409 || err.response?.data?.rejected) {
        const resp = err.response?.data || {};
        setRejectionData({
          rejected: resp.rejected || 'Large edit detected (too many deletions or modifications).',
          changeReport: resp.change_report || null,
          hint: resp.hint || 'Re-submit with confirm=true if intentional.'
        });
      } else {
        const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to process edited DOCX upload.';
        toast.error(errMsg);
      }
    } finally {
      setIsUploading(false);
      setStatusStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none font-sans">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 text-left max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--color-archive-green)]/10 text-[var(--color-archive-green)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif text-[var(--color-archive-green)]">
                Upload Edited DOCX
              </h3>
              <p className="text-xs text-[var(--color-muted-ink)] font-sans mt-0.5">
                Volume: <strong className="text-[var(--color-ink)]">{book.title}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            disabled={isUploading}
            className="p-1.5 rounded-lg text-[var(--color-muted-ink)] hover:text-[var(--color-ink)] hover:bg-[var(--color-panel)] transition-colors disabled:opacity-30 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GUARDRAIL 409 REJECTION MODAL STATE */}
        {rejectionData ? (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-xl bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/30 text-[var(--color-danger)] space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0 text-[var(--color-danger)]" />
                <span>Large Edit Detected</span>
              </div>
              <p className="text-xs leading-relaxed font-serif">
                The edited DOCX removed or changed a large portion of the book. This may happen if the wrong file was uploaded or hidden bookmarks were removed.
              </p>
              {rejectionData.rejected && (
                <div className="text-[11px] font-mono bg-black/5 p-2 rounded border border-[var(--color-danger)]/20 mt-1">
                  <strong>Reason:</strong> {rejectionData.rejected}
                </div>
              )}
              {rejectionData.hint && (
                <p className="text-[11px] font-sans italic opacity-90">
                  Hint: {rejectionData.hint}
                </p>
              )}
            </div>

            {/* Change report summary in rejection state */}
            {rejectionData.changeReport && (
              <div className="p-4 rounded-xl bg-[var(--color-panel)] border border-[var(--color-border)] text-xs space-y-2">
                <span className="text-[9px] font-bold text-[var(--color-muted-ink)] uppercase tracking-widest block">
                  Change Report Telemetry
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>Kept: <strong className="text-[var(--color-ink)]">{rejectionData.changeReport.kept ?? 0}</strong></div>
                  <div>Text Changed: <strong className="text-[var(--color-warning)]">{rejectionData.changeReport.text_changed ?? 0}</strong></div>
                  <div>Added: <strong className="text-[var(--color-success)]">{rejectionData.changeReport.added ?? 0}</strong></div>
                  <div>Deleted: <strong className="text-[var(--color-danger)]">{rejectionData.changeReport.deleted ?? 0}</strong></div>
                  <div>Reordered: <strong>{rejectionData.changeReport.reordered ?? 0}</strong></div>
                  <div>Total Before / After: <strong>{rejectionData.changeReport.total_before ?? 0} → {rejectionData.changeReport.total_after ?? 0}</strong></div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--color-border)]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectionData(null)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleUploadSubmit(true)}
                disabled={isUploading}
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {statusStep || 'Resubmitting...'}
                  </span>
                ) : (
                  'Confirm and Re-submit'
                )}
              </Button>
            </div>
          </div>
        ) : changeReportData ? (
          /* SUCCESS CHANGE REPORT SUMMARY STATE */
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-xl bg-[var(--color-success-soft)] border border-[var(--color-success)]/30 text-[var(--color-success)] space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-[var(--color-success)]" />
                <span>DOCX Edit Import Triggered</span>
              </div>
              <p className="text-xs leading-relaxed font-serif text-[var(--color-ink)]">
                {changeReportData.message || 'Edited DOCX uploaded. Your changes will be imported back into the book data and re-rendered.'}
              </p>
            </div>

            {changeReportData.change_report ? (
              <div className="p-4 rounded-xl bg-[var(--color-panel)] border border-[var(--color-border)] text-xs space-y-3">
                <span className="text-[10px] font-bold text-[var(--color-archive-green)] uppercase tracking-widest block font-sans">
                  DOCX Import Summary
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>Kept: <strong className="text-[var(--color-ink)]">{changeReportData.change_report.kept ?? 0}</strong></div>
                  <div>Text Changed: <strong className="text-[var(--color-warning)]">{changeReportData.change_report.text_changed ?? 0}</strong></div>
                  <div>Added: <strong className="text-[var(--color-success)]">{changeReportData.change_report.added ?? 0}</strong></div>
                  <div>Deleted: <strong className="text-[var(--color-danger)]">{changeReportData.change_report.deleted ?? 0}</strong></div>
                  <div>Reordered: <strong>{changeReportData.change_report.reordered ?? 0}</strong></div>
                  <div>Total Before / After: <strong>{changeReportData.change_report.total_before ?? 0} → {changeReportData.change_report.total_after ?? 0}</strong></div>
                </div>

                {Array.isArray(changeReportData.warnings) && changeReportData.warnings.length > 0 && (
                  <div className="pt-2 border-t border-[var(--color-border)]">
                    <span className="text-[9px] font-bold text-[var(--color-warning)] uppercase tracking-widest block">
                      Warnings:
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-[var(--color-muted-ink)] mt-1 space-y-0.5 font-serif">
                      {changeReportData.warnings.map((warn, i) => (
                        <li key={i}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[var(--color-panel)] border border-[var(--color-border)] text-xs text-[var(--color-muted-ink)] font-serif">
                DOCX edit import started. The book will return to the render queue shortly.
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-[var(--color-border)]">
              <Button variant="primary" size="sm" onClick={handleCloseModal}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* REGULAR UPLOAD FORM & GUIDANCE STATE */
          <div className="space-y-6">
            {/* Reviewer Guidance Box */}
            <div className="p-4 rounded-xl bg-[var(--color-panel)] border border-[var(--color-border)] text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-[var(--color-archive-green)] font-bold font-serif text-sm">
                <Info className="w-4 h-4 shrink-0 text-[var(--color-warning)]" />
                <span>Reviewer Guidance</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-[var(--color-muted-ink)] space-y-1 font-serif leading-relaxed">
                <li>Download the rendered DOCX first.</li>
                <li>Edit in <strong>Microsoft Word</strong> only.</li>
                <li>Do not use Google Docs or LibreOffice because they may remove the hidden bookmarks needed to track edits.</li>
                <li>Text changes are captured; formatting changes are ignored (formatting is controlled by the renderer).</li>
                <li>The system automatically backs up the previous <code>structured.json</code> before applying edits.</li>
              </ul>
              <p className="text-[11px] text-[var(--color-ink-soft)] italic pt-1 border-t border-[var(--color-border)]/60">
                “Upload the Word document after editing. Your changes will be imported back into the book data and the PDF, DOCX, and EPUB will be re-rendered.”
              </p>
            </div>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`p-6 border-2 border-dashed rounded-xl text-center transition-all cursor-pointer ${
                dragOver
                  ? 'border-[var(--color-archive-green)] bg-[var(--color-archive-green)]/5 scale-[1.01]'
                  : file
                  ? 'border-[var(--color-success)] bg-[var(--color-success-soft)]/20'
                  : 'border-[var(--color-border)] hover:border-[var(--color-archive-green)]/60 bg-[var(--color-panel)]/40'
              }`}
            >
              <input
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                disabled={isUploading}
                id="docx-file-input"
                className="hidden"
              />
              <label htmlFor="docx-file-input" className="cursor-pointer block space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-archive-green)] shadow-sm">
                  {file ? <FileText className="w-6 h-6 text-[var(--color-success)]" /> : <Upload className="w-6 h-6" />}
                </div>
                {file ? (
                  <div className="space-y-1">
                    <span className="font-bold text-xs text-[var(--color-ink)] block font-mono">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-[var(--color-muted-ink)] block">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to submit
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-[var(--color-archive-green)] block">
                      Click to browse or drag & drop edited .docx file
                    </span>
                    <span className="text-[10px] text-[var(--color-muted-ink)] block mt-0.5">
                      Microsoft Word (.docx) documents only
                    </span>
                  </div>
                )}
              </label>
            </div>

            {/* Status indicator during upload */}
            {isUploading && statusStep && (
              <div className="p-3 rounded-xl bg-[var(--color-archive-green)]/10 border border-[var(--color-archive-green)]/30 text-xs text-[var(--color-archive-green)] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-bold uppercase tracking-wider text-[10px] font-mono">{statusStep}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseModal}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleUploadSubmit(false)}
                disabled={!file || isUploading}
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {statusStep || 'Processing...'}
                  </span>
                ) : (
                  'Upload & Import Edits'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocxEditUploadModal;
