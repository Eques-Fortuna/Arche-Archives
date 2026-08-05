import React from 'react';
import {
  Check,
  Clock,
  AlertCircle,
  ShieldCheck,
  Lock,
  Archive,
  Loader2,
  FileCheck,
  BookCheck,
  Cpu
} from 'lucide-react';

/**
 * Pipeline Compilation Stepper mapping real backend book pipeline state
 */
const BookPipelineStepper = ({ book }) => {
  const isArchived =
    String(book?.publication_status || '').toLowerCase() === 'archived' ||
    String(book?.publicationStatus || '').toLowerCase() === 'archived' ||
    String(book?.current_stage || '').toLowerCase() === 'archived' ||
    String(book?.currentStage || '').toLowerCase() === 'archived';

  // Extract real backend fields
  const currentStage = String(book?.current_stage || book?.currentStage || '').toLowerCase();
  const stageStatus = String(book?.stage_status || book?.stageStatus || '').toLowerCase();
  const textStatus = String(book?.text_status || book?.textStatus || '').toLowerCase();
  const coverStatus = String(book?.cover_status || book?.coverStatus || '').toLowerCase();
  const rightsStatus = String(book?.rights_status || book?.rightsStatus || '').toLowerCase();
  const pubStatus = String(book?.publication_status || book?.publicationStatus || '').toLowerCase();
  const dataStatus = String(book?.data_status || book?.dataStatus || '').toLowerCase();

  // Order of stage progression for comparison
  const stageOrder = [
    'uploaded',
    'normalization',
    'normalized',
    'structure',
    'structured',
    'rendering',
    'rendered',
    'text_review',
    'cover_review',
    'rights_review',
    'assembly',
    'assembled',
    'published',
    'packaged'
  ];

  const getStageIdx = (stg) => {
    const s = String(stg || '').toLowerCase();
    return stageOrder.indexOf(s);
  };

  const currentIdx = getStageIdx(currentStage);

  // Use backend provided stepper data if available
  const rawBackendSteps = book?.pipeline_status || book?.stepper || book?.steps;

  let steps = [];

  if (Array.isArray(rawBackendSteps) && rawBackendSteps.length > 0) {
    steps = rawBackendSteps.map((s) => ({
      id: s.id || s.key || s.name,
      label: s.label || s.name || s.title,
      status: s.status, // complete | in_progress | failed | blocked | locked | requires_human_approval | skipped
      isHumanApproval: s.is_human_approval || s.requires_human_approval
    }));
  } else {
    // 10 canonical steps mapper based on real fields
    steps = [
      {
        id: 'uploaded',
        label: 'Uploaded',
        status: 'complete'
      },
      {
        id: 'normalized',
        label: 'Normalized',
        status:
          currentIdx > getStageIdx('normalized') || (currentStage === 'normalized' && stageStatus === 'complete')
            ? 'complete'
            : currentStage === 'normalized' && stageStatus === 'failed'
            ? 'failed'
            : currentStage === 'normalized'
            ? 'in_progress'
            : 'locked'
      },
      {
        id: 'structured',
        label: 'Structured',
        status:
          currentIdx > getStageIdx('structured') || (currentStage === 'structured' && stageStatus === 'complete')
            ? 'complete'
            : currentStage === 'structured' && stageStatus === 'failed'
            ? 'failed'
            : currentStage === 'structured'
            ? 'in_progress'
            : 'locked'
      },
      {
        id: 'rendered',
        label: 'Rendered',
        status:
          currentIdx > getStageIdx('rendered') || (currentStage === 'rendered' && stageStatus === 'complete') || (currentStage === 'rendering' && stageStatus === 'complete')
            ? 'complete'
            : currentStage === 'rendering' && stageStatus === 'failed'
            ? 'failed'
            : currentStage === 'rendering'
            ? 'in_progress'
            : 'locked'
      },
      {
        id: 'text_approved',
        label: 'Text Approved',
        isHumanApproval: true,
        status:
          textStatus === 'approved'
            ? 'complete'
            : textStatus === 'rejected' || textStatus === 'needs_changes'
            ? 'failed'
            : textStatus === 'pending' || textStatus === 'needs_review' || currentStage === 'text_review'
            ? 'requires_human_approval'
            : 'locked'
      },
      {
        id: 'cover_approved',
        label: 'Cover Approved',
        isHumanApproval: true,
        status:
          coverStatus === 'approved'
            ? 'complete'
            : coverStatus === 'rejected' || coverStatus === 'needs_changes'
            ? 'failed'
            : coverStatus === 'pending' || coverStatus === 'pending_review' || currentStage === 'cover_review'
            ? 'requires_human_approval'
            : 'locked'
      },
      {
        id: 'rights_verified',
        label: 'Rights Verified',
        isHumanApproval: true,
        status:
          rightsStatus === 'verified' || rightsStatus === 'approved'
            ? 'complete'
            : rightsStatus === 'rejected'
            ? 'failed'
            : rightsStatus === 'pending' || rightsStatus === 'needs_review' || currentStage === 'rights_review'
            ? 'requires_human_approval'
            : 'locked'
      },
      {
        id: 'assembly',
        label: 'Final Assembly',
        status:
          currentStage === 'assembled' || pubStatus === 'published' || currentIdx > getStageIdx('assembled')
            ? 'complete'
            : currentStage === 'assembly' && stageStatus === 'failed'
            ? 'failed'
            : currentStage === 'assembly'
            ? 'in_progress'
            : 'locked'
      },
      {
        id: 'published',
        label: 'Published',
        status:
          pubStatus === 'published'
            ? 'complete'
            : pubStatus === 'ready' || pubStatus === 'ready_to_publish'
            ? 'in_progress'
            : 'locked'
      },
      {
        id: 'packaged',
        label: 'Data Packaged',
        status:
          dataStatus === 'packaged' || dataStatus === 'complete'
            ? 'complete'
            : dataStatus === 'failed'
            ? 'failed'
            : dataStatus === 'in_progress'
            ? 'in_progress'
            : 'locked'
      }
    ];
  }

  return (
    <div className="w-full space-y-4 select-none">
      {/* Archived banner if book is archived */}
      {isArchived && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2 font-medium">
          <Archive className="w-4 h-4 text-amber-400 shrink-0" />
          <span>This book is archived. Pipeline compilation steps are paused.</span>
        </div>
      )}

      {/* Stepper Grid Container */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3 pt-2">
        {steps.map((step, index) => {
          let statusClass = 'border-[#DED2BE] bg-[#FAF6EE] text-[#5F5A52]';
          let badgeText = 'Locked';
          let StepIcon = Lock;

          const isComplete = step.status === 'complete';
          const isFailed = step.status === 'failed';
          const isInProgress = step.status === 'in_progress' || step.status === 'active';
          const isHumanApproval = step.status === 'requires_human_approval' || step.isHumanApproval;
          const isBlocked = step.status === 'blocked';
          const isSkipped = step.status === 'skipped';

          if (isComplete) {
            statusClass = 'border-[#3F6F5A] bg-[#3F6F5A] text-[#FAF6EE] shadow-sm';
            badgeText = 'Complete';
            StepIcon = Check;
          } else if (isFailed) {
            statusClass = 'border-[#8A2D3B] bg-[#8A2D3B] text-[#FAF6EE] animate-pulse';
            badgeText = 'Failed';
            StepIcon = AlertCircle;
          } else if (isInProgress) {
            statusClass = 'border-[#B86B3E] bg-[#B86B3E] text-[#FAF6EE] animate-pulse';
            badgeText = 'In Progress';
            StepIcon = Loader2;
          } else if (isHumanApproval) {
            statusClass = 'border-[#C79A3B] bg-[#C79A3B] text-[#FAF6EE]';
            badgeText = 'Needs Review';
            StepIcon = ShieldCheck;
          } else if (isBlocked) {
            statusClass = 'border-rose-900 bg-rose-900 text-rose-100';
            badgeText = 'Blocked';
            StepIcon = AlertCircle;
          } else if (isSkipped) {
            statusClass = 'border-slate-300 bg-slate-200 text-slate-500';
            badgeText = 'Skipped';
            StepIcon = Clock;
          }

          return (
            <div
              key={index}
              className="flex flex-col items-center justify-between p-3 rounded-xl border border-[#DED2BE] bg-[#FFFDF8] hover:border-[#2A473E] transition-all text-center gap-2"
            >
              {/* Step number header */}
              <span className="text-[9px] font-mono text-[#5F5A52] uppercase font-bold">
                Step {index + 1}
              </span>

              {/* Stepper Bubble */}
              <div
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-xs ${statusClass} transition-all duration-300 shadow-sm`}
              >
                <StepIcon className={`w-4 h-4 ${isInProgress ? 'animate-spin' : ''}`} />
              </div>

              {/* Step Label */}
              <div>
                <p className="text-[11px] font-bold text-[#1A1A1A] font-sans leading-tight">
                  {step.label}
                </p>
                <p
                  className={`text-[9px] uppercase tracking-wider font-bold mt-1 ${
                    isComplete
                      ? 'text-[#3F6F5A]'
                      : isFailed
                      ? 'text-[#8A2D3B]'
                      : isInProgress
                      ? 'text-[#B86B3E]'
                      : isHumanApproval
                      ? 'text-[#C79A3B]'
                      : 'text-[#5F5A52]'
                  }`}
                >
                  {badgeText}
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
