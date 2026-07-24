import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';

/**
 * Reusable visual pipeline stepper displaying compilation phases
 */
const BookPipelineStepper = ({ book }) => {
  const currentStage = String(book?.current_stage || '').toLowerCase();
  const stageStatus = String(book?.stage_status || '').toLowerCase();
  const textStatus = String(book?.text_status || '').toLowerCase();
  const coverStatus = String(book?.cover_status || '').toLowerCase();
  const rightsStatus = String(book?.rights_status || '').toLowerCase();
  const pubStatus = String(book?.publication_status || '').toLowerCase();

  const steps = [
    { id: 'upload', label: 'Uploaded', isComplete: true }, // Initial step is always complete
    { 
      id: 'normalization', 
      label: 'Normalized', 
      isComplete: !['upload'].includes(currentStage), 
      isActive: currentStage === 'normalization'
    },
    { 
      id: 'structure', 
      label: 'Structured', 
      isComplete: !['upload', 'normalization'].includes(currentStage), 
      isActive: currentStage === 'structure' 
    },
    { 
      id: 'rendering', 
      label: 'Rendered', 
      isComplete: !['upload', 'normalization', 'structure'].includes(currentStage), 
      isActive: currentStage === 'rendering' 
    },
    { 
      id: 'text_approved', 
      label: 'Text Approved', 
      isComplete: textStatus === 'approved', 
      isActive: textStatus === 'pending' || textStatus === 'needs_review' 
    },
    { 
      id: 'cover_approved', 
      label: 'Cover Approved', 
      isComplete: coverStatus === 'approved', 
      isActive: coverStatus === 'pending' || coverStatus === 'needs_review' 
    },
    { 
      id: 'rights_verified', 
      label: 'Rights Verified', 
      isComplete: rightsStatus === 'verified' || rightsStatus === 'approved', 
      isActive: rightsStatus === 'pending' || rightsStatus === 'needs_review' 
    },
    { 
      id: 'assembly', 
      label: 'Assembled', 
      isComplete: pubStatus === 'published' || (!['upload', 'normalization', 'structure', 'rendering'].includes(currentStage) && textStatus === 'approved' && coverStatus === 'approved' && rightsStatus === 'verified'), 
      isActive: currentStage === 'assembly' 
    },
    { 
      id: 'published', 
      label: 'Published', 
      isComplete: pubStatus === 'published', 
      isActive: pubStatus === 'ready_to_publish' 
    },
  ];

  return (
    <div className="w-full py-4 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
        {/* Horizontal connector line on desktop */}
        <div className="absolute top-5 left-4 right-4 h-0.5 bg-[#DED2BE] -translate-y-1/2 hidden md:block z-0" />

        {steps.map((step, index) => {
          let statusClass = 'border-[#DED2BE] bg-[#FFFDF8] text-[var(--color-ink-soft)]';
          let Icon = Clock;
          
          const isFailed = step.isActive && (stageStatus === 'failed' || stageStatus === 'error');

          if (step.isComplete) {
            statusClass = 'border-[#3F6F5A] bg-[#3F6F5A] text-[#FAF6EE] shadow-sm';
            Icon = Check;
          } else if (isFailed) {
            statusClass = 'border-[#8A2D3B] bg-[#8A2D3B] text-[#FAF6EE] animate-pulse';
            Icon = AlertCircle;
          } else if (step.isActive) {
            statusClass = 'border-[#B86B3E] bg-[#B86B3E] text-[#FAF6EE] animate-pulse';
            Icon = Clock;
          }

          return (
            <div key={index} className="flex md:flex-col items-center gap-3 md:gap-2.5 flex-1 relative z-10">
              {/* Stepper Bubble */}
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm ${statusClass} transition-all duration-300`}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Step Label */}
              <div className="text-left md:text-center">
                <p className="text-xs font-semibold text-[#1A1A1A] font-sans">{step.label}</p>
                <p className="text-[9px] text-[#5F5A52] uppercase tracking-wider font-bold mt-0.5">
                  {step.isComplete ? 'Complete' : isFailed ? 'Failed' : step.isActive ? 'Active' : 'Queued'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookPipelineStepper;
