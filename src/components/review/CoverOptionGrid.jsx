import React, { useState, useEffect } from 'react';
import { Check, Image as ImageIcon, Download, Eye, Loader2 } from 'lucide-react';
import { getFileSignedUrl } from '../../lib/api';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

/**
 * Reusable selection grid for cover candidates with image previews and download options
 */
const CoverOptionGrid = ({ book, options = [], selectedOption, onSelect }) => {
  const [resolvedUrls, setResolvedUrls] = useState({});
  const [loadingUrls, setLoadingUrls] = useState({});

  useEffect(() => {
    if (!book || !options.length) return;

    options.forEach(async (option) => {
      const optionNumber = option.option_number;
      // Find matching file in book.files
      const file = book.files?.find(f => 
        f.storage_path === option.storage_path ||
        String(f.file_type).toLowerCase().includes(`cover_option_${optionNumber}`) ||
        String(f.file_type).toLowerCase().includes(`cover_option${optionNumber}`) ||
        String(f.file_type).toLowerCase().includes(`cover_${optionNumber}`) ||
        String(f.file_type).toLowerCase().includes(`option_${optionNumber}`)
      );

      if (file) {
        const fileId = file.file_id || file.id;
        setLoadingUrls(prev => ({ ...prev, [optionNumber]: true }));
        try {
          const res = await getFileSignedUrl(book.book_id, fileId);
          if (res?.url) {
            setResolvedUrls(prev => ({ ...prev, [optionNumber]: res.url }));
          }
        } catch (e) {
          console.error(`Error loading cover option ${optionNumber} URL:`, e);
        } finally {
          setLoadingUrls(prev => ({ ...prev, [optionNumber]: false }));
        }
      }
    });
  }, [book, options]);

  const handleDownloadCover = async (option) => {
    const optionNumber = option.option_number;
    // If already resolved, open in new tab
    if (resolvedUrls[optionNumber]) {
      window.open(resolvedUrls[optionNumber], '_blank');
      return;
    }

    const file = book.files?.find(f => 
      f.storage_path === option.storage_path ||
      String(f.file_type).toLowerCase().includes(`cover_option_${optionNumber}`) ||
      String(f.file_type).toLowerCase().includes(`cover_option${optionNumber}`) ||
      String(f.file_type).toLowerCase().includes(`cover_${optionNumber}`) ||
      String(f.file_type).toLowerCase().includes(`option_${optionNumber}`)
    );

    if (!file) {
      toast.error(`No file registry found for cover Option ${optionNumber}`);
      return;
    }

    const toastId = toast.loading(`Generating secure link for Option ${optionNumber}...`);
    try {
      const data = await getFileSignedUrl(book.book_id, file.file_id || file.id);
      toast.dismiss(toastId);
      if (data && data.url) {
        window.open(data.url, '_blank');
      } else {
        toast.error('Failed to resolve cover url.');
      }
    } catch (e) {
      toast.dismiss(toastId);
      toast.error('Error generating secure link.');
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {options.map((option, index) => {
        const optionNumber = option.option_number || index + 1;
        const isSelected = selectedOption === optionNumber;

        return (
          <div
            key={option.id || index}
            className={`rounded-2xl border overflow-hidden relative group transition-all duration-300 flex flex-col justify-between ${
              isSelected
                ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10'
                : 'border-white/5 bg-slate-900/60 hover:bg-slate-900 hover:border-white/10'
            }`}
          >
            {/* Visual Cover Preview */}
            <div
              onClick={() => onSelect(optionNumber, option.storage_path)}
              className="h-72 bg-slate-950 flex flex-col items-center justify-center border-b border-white/5 relative cursor-pointer group"
            >
              {loadingUrls[optionNumber] ? (
                <div className="text-center space-y-2">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
                  <span className="text-[10px] text-slate-500">Resolving cover...</span>
                </div>
              ) : resolvedUrls[optionNumber] ? (
                <img 
                  src={resolvedUrls[optionNumber]} 
                  alt={`Option ${optionNumber}`} 
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <>
                  <ImageIcon className={`w-12 h-12 transition-transform duration-500 group-hover:scale-110 ${isSelected ? 'text-cyan-400' : 'text-slate-700'}`} />
                  <span className="text-[10px] text-slate-500 font-mono mt-2 truncate max-w-[150px] px-2">
                    {option.storage_path || `Option_${optionNumber}.jpg`}
                  </span>
                </>
              )}

              {isSelected && (
                <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold">
                  <Check className="w-4 h-4" />
                </div>
              )}
              
              {/* Download overlay for full preview */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadCover(option);
                }}
                className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-950 border border-white/10 text-slate-300 hover:text-white transition-colors"
                title="View/Download Full Cover Image"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            {/* Approve Button Below each card */}
            <div className="p-4 border-t border-white/5 bg-slate-900/40">
              <Button
                variant={isSelected ? "primary" : "outline"}
                className="w-full justify-center text-xs"
                onClick={() => onSelect(optionNumber, option.storage_path)}
              >
                Approve Option {optionNumber}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CoverOptionGrid;
