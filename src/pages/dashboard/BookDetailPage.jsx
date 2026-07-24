import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  AlertOctagon,
  Terminal,
  Play,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Image as ImageIcon,
  FileText,
  Cpu,
  Upload
} from 'lucide-react';
import {
  getAdminBookById,
  runNextPhase,
  runPhase,
  retryPhase,
  resetBookStageStatus,
  publishBook,
  getAdminBookQc,
  getAdminBookRenderReports,
  getAdminBookApprovals
} from '../../lib/api';
import HumanCoverUploadModal from '../../components/review/HumanCoverUploadModal';

// Context
import { useAuth } from '../../context/AuthContext';

// Components
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Tabs from '../../components/ui/Tabs';
import BookMetadata from '../../components/books/BookMetadata';
import BookFilesTable from '../../components/books/BookFilesTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

// Orphan integrations
import BookPipelineStepper from '../../components/books/BookPipelineStepper';
import BookApprovals from '../../components/books/BookApprovals';
import BookChapters from '../../components/books/BookChapters';
import BookQcReports from '../../components/books/BookQcReports';
import BookRenderReports from '../../components/books/BookRenderReports';

const BookDetailPage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Reset Stage Form State
  const [resetStage, setResetStage] = useState('');
  const [resetStatus, setResetStatus] = useState('complete');

  // Explicit Phase Trigger state
  const [phaseToRun, setPhaseToRun] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHumanUploadModal, setShowHumanUploadModal] = useState(false);

  // Tabs state for the right column
  const [rightActiveTab, setRightActiveTab] = useState('metadata');

  // Query book data
  const {
    data: book,
    isLoading: bookLoading,
    error: bookError,
    refetch: refetchBook,
  } = useQuery({
    queryKey: ['adminBook', id],
    queryFn: () => getAdminBookById(id),
  });

  // Query orphan telemetry data
  const { data: qcData } = useQuery({
    queryKey: ['adminBookQc', id],
    queryFn: () => getAdminBookQc(id),
    enabled: !!id && rightActiveTab === 'qc',
  });

  const { data: renderReports } = useQuery({
    queryKey: ['adminBookRenderReports', id],
    queryFn: () => getAdminBookRenderReports(id),
    enabled: !!id && rightActiveTab === 'compiles',
  });

  const { data: approvalsData } = useQuery({
    queryKey: ['adminBookApprovals', id],
    queryFn: () => getAdminBookApprovals(id),
    enabled: !!id && (rightActiveTab === 'approvals' || rightActiveTab === 'metadata'),
  });

  // Mutations
  const runPhaseMutation = useMutation({
    mutationFn: (phase) => runPhase(id, phase),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminBook', id] });
      toast.success(`Phase ${data.triggered_phase || phaseToRun} triggered successfully!`);
      setShowConfirmModal(false);
      setPhaseToRun(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to trigger phase.');
      setShowConfirmModal(false);
      setPhaseToRun(null);
    },
  });

  const runNextMutation = useMutation({
    mutationFn: () => runNextPhase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBook', id] });
      toast.success('Automated pipeline next phase started!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to trigger run phase.');
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => retryPhase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBook', id] });
      toast.success('Retry command successfully processed!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to dispatch retry.');
    },
  });

  const resetMutation = useMutation({
    mutationFn: (payload) => resetBookStageStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBook', id] });
      toast.success('Book stage and status successfully overridden!');
      setResetStage('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to reset stage/status.');
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => publishBook(id, { public_url: `/books/${book.slug}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBook', id] });
      toast.success('Book published successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to publish book.');
    }
  });

  const handlePublish = () => {
    publishMutation.mutate();
  };

  const handleRetry = () => {
    retryMutation.mutate();
  };

  const handleResetStage = (e) => {
    e.preventDefault();
    if (!resetStage) {
      toast.error('Please select a target stage to reset.');
      return;
    }
    resetMutation.mutate({
      target_stage: resetStage,
      target_status: resetStatus,
    });
  };

  if (bookLoading) {
    return <LoadingSpinner message="Synchronizing book orchestration datasets..." />;
  }

  if (bookError || !book) {
    return (
      <ErrorState
        title="Failed to Load Book Details"
        description="We encountered an issue retrieving detailed analytics logs for this book."
        onRetry={() => refetchBook()}
      />
    );
  }

  // Generate computed staging logs as fallback
  const getComputedLogs = () => {
    const logs = [];
    const timestamp = new Date(book.updated_at || Date.now());
    
    const addLog = (msg, stage, status, timeDiff) => {
      const logTime = new Date(timestamp.getTime() - timeDiff);
      logs.push({
        time: logTime.toLocaleTimeString(),
        message: `[STAGE: ${stage.toUpperCase()}] ${msg} (status: ${status})`,
      });
    };

    addLog('Raw book uploaded and queued.', 'upload', 'complete', 3600000);
    
    const stagesOrdered = ['normalization', 'structure', 'rendering', 'text_review', 'cover_review', 'assembled'];
    const currentIdx = stagesOrdered.indexOf(String(book.current_stage).toLowerCase());

    if (currentIdx >= 0) {
      addLog('Phase 1 normalized plain text successfully.', 'normalization', 'complete', 3000000);
    }
    if (currentIdx >= 1) {
      addLog('Phase 2 structured chapters and metadata generated.', 'structure', 'complete', 2400000);
    }
    if (currentIdx >= 2) {
      addLog('Phase 3 layout rendering formats generated.', 'rendering', 'complete', 1800000);
    }
    if (book.text_status === 'approved') {
      addLog('Text layout audit approved by operator.', 'text_review', 'approved', 1200000);
    }
    if (book.cover_status === 'approved') {
      addLog('Cover candidates layout approved by operator.', 'cover_review', 'approved', 600000);
    }
    if (book.rights_status === 'verified') {
      addLog('Rights clearance verification signed off.', 'rights_review', 'verified', 300000);
    }

    if (book.stage_status === 'failed') {
      logs.push({
        time: timestamp.toLocaleTimeString(),
        message: `[ERROR] Execution halted: ${book.last_error || 'Internal compilation error.'}`,
        isError: true,
      });
    } else {
      logs.push({
        time: timestamp.toLocaleTimeString(),
        message: `[STATUS] Stage updated to ${book.current_stage.toUpperCase()} (${book.stage_status}). Ready for next operation.`,
      });
    }

    return logs.reverse();
  };

  const computedLogs = getComputedLogs();

  const STAGE_OPTIONS = [
    { value: 'uploaded', label: 'Uploaded' },
    { value: 'normalized', label: 'Normalized' },
    { value: 'structured', label: 'Structured' },
    { value: 'rendering', label: 'Rendering' },
    { value: 'rendered', label: 'Rendered' },
    { value: 'text_review', label: 'Text Review' },
    { value: 'cover_review', label: 'Cover Review' },
    { value: 'assembled', label: 'Assembled' },
  ];

  const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'complete', label: 'Complete' },
    { value: 'failed', label: 'Failed' },
    { value: 'blocked', label: 'Blocked' },
  ];

  const fileTypes = book.files ? book.files.map(f => f.file_type || f.fileType) : [];
  const hasApprovedTextFiles = fileTypes.includes('approved_pdf') && fileTypes.includes('approved_docx') && fileTypes.includes('approved_epub');
  
  const showPhase1 = book.current_stage === 'uploaded' && book.stage_status === 'pending';
  const showPhase2 = book.current_stage === 'normalized' && book.stage_status === 'complete';
  const showPhase3 = book.current_stage === 'structured' && book.stage_status === 'complete';
  const showPhase4 = book.text_status === 'approved' && !hasApprovedTextFiles;
  const showPhase5 = book.text_status === 'approved' && book.cover_status === 'pending';
  const showPhase6 = book.current_stage === 'cover_review' && book.cover_status === 'approved';
  const showPhase8 = book.current_stage === 'cover_approved' &&
                     book.text_status === 'approved' &&
                     book.cover_status === 'approved' &&
                     book.rights_status === 'verified';
  const showPhase10 = ['assembled', 'published'].includes(book.current_stage) &&
                      book.rights_status === 'verified' &&
                      book.data_status !== 'packaged';

  const canTrigger = user?.role === 'admin' || user?.role === 'operator';
  const isArchived = book.current_stage === 'archived';
  const isCoverApproved = book.cover_status === 'approved' || book.current_stage === 'cover_approved';
  const isRoleEligible = user?.role === 'admin' || user?.role === 'operator' || user?.role === 'cover_reviewer';

  const showHumanCoverOption = 
    !isArchived &&
    !isCoverApproved &&
    isRoleEligible &&
    (book.text_status === 'approved' || book.textStatus === 'approved') &&
    ['pending', 'needs_changes', 'rejected'].includes(book.cover_status || book.coverStatus) &&
    ['text_approved', 'cover_generation', 'cover_review'].includes(book.current_stage || book.currentStage);

  const detailTabs = [
    { id: 'metadata', label: 'Profile Metadata' },
    { id: 'approvals', label: 'Review Audits' },
    { id: 'qc', label: 'Automated QC' },
    { id: 'compiles', label: 'Compiler Logs' },
    { id: 'chapters', label: 'Chapters Outline' },
  ];

  return (
    <div className="space-y-8 w-full">
      {/* Back link */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-widest text-[#5F5A52] hover:text-[#2A473E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard Pipeline
        </Link>
      </div>

      {/* Book header */}
      <Card className="p-6 border border-[#DED2BE] bg-[#FFFDF8]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={book.stage_status} />
              <StatusBadge status={book.publication_status} />
              <StatusBadge status={book.rights_status} />
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mt-3 font-serif leading-tight">{book.title}</h2>
            <p className="text-xs text-[#5F5A52] mt-1 font-sans uppercase tracking-wider font-semibold">Author: {book.author}</p>
          </div>
          <div className="text-right text-[10px] text-[#5F5A52] font-mono uppercase tracking-wider">
            <span>Orchestrator ID: {book.book_id}</span>
          </div>
        </div>

        {/* Errors view if any */}
        {book.last_error && (
          <div className="mt-6 p-4 rounded bg-[#8A2D3B]/5 border border-[#8A2D3B]/20 text-[#8A2D3B] flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider block">Pipeline Error Triggered</span>
              <p className="text-xs font-mono">{book.last_error}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Book Pipeline Stepper (Orphan Component Integrated) */}
      <Card className="p-6 border border-[#DED2BE] bg-[#FFFDF8]">
        <h3 className="text-xs font-sans font-bold text-[#2A473E] uppercase tracking-widest border-b border-[#DED2BE] pb-2.5 mb-4">
          Pipeline Compilation Stepper
        </h3>
        <BookPipelineStepper book={book} />
      </Card>

      {/* Detail Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Status, Action Checklist, File Assets */}
        <div className="space-y-8">
          {/* Status Panel */}
          <Card className="p-6 space-y-5 border border-[#DED2BE] bg-[#FFFDF8]">
            <div className="flex justify-between items-center border-b border-[#DED2BE] pb-3">
              <h3 className="text-xs font-sans font-bold text-[#2A473E] uppercase tracking-widest">Status Panel</h3>
              <span className="text-[10px] text-[#5F5A52] font-mono uppercase tracking-wider font-semibold">Retries: {book.retry_count || 0}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#FAF6EE] rounded border border-[#DED2BE]">
                <span className="text-[#5F5A52] block text-[9px] uppercase tracking-wider font-bold">Active Stage</span>
                <span className="text-[#1A1A1A] capitalize font-bold mt-1 block font-serif text-sm">{String(book.current_stage || 'N/A').replace('_', ' ')}</span>
              </div>
              <div className="p-3 bg-[#FAF6EE] rounded border border-[#DED2BE]">
                <span className="text-[#5F5A52] block text-[9px] uppercase tracking-wider font-bold">Stage Status</span>
                <span className="mt-1.5 block"><StatusBadge status={book.stage_status} /></span>
              </div>
            </div>

            {/* Staging Logs Terminal */}
            <div className="space-y-2">
              <span className="text-[9px] text-[#5F5A52] font-bold uppercase tracking-widest flex items-center gap-1.5 font-sans">
                <Terminal className="w-3.5 h-3.5 text-[#2A473E]" />
                Staging Logs
              </span>
              <div className="p-4 bg-[var(--color-code-bg)] text-[var(--color-code-text)] rounded font-mono text-[10px] h-48 overflow-y-auto space-y-1.5 border border-[var(--color-border)] select-all">
                {book.pipeline_runs && book.pipeline_runs.length > 0 ? (
                  book.pipeline_runs.map((run, i) => (
                    <div key={i} className={run.status === 'failed' ? 'text-[var(--color-danger-soft)] font-bold' : 'text-[var(--color-code-muted)]'}>
                      [{new Date(run.started_at).toLocaleTimeString()}] Phase: {run.phase} - {run.status} 
                      {run.error_message && ` | Error: ${run.error_message}`}
                    </div>
                  ))
                ) : (
                  computedLogs.map((log, i) => (
                    <div key={i} className={log.isError ? 'text-[var(--color-danger-soft)] font-bold' : 'text-[var(--color-code-muted)]'}>
                      [{log.time}] {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Stage Controls */}
            {canTrigger && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#DED2BE]">
                {showPhase1 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => { setPhaseToRun('1'); setShowConfirmModal(true); }}
                    disabled={runPhaseMutation.isPending}
                    className="flex items-center gap-1 text-[10px]"
                  >
                    <Play className="w-3 h-3" />
                    Run Phase 1
                  </Button>
                )}
                {showPhase2 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => { setPhaseToRun('2'); setShowConfirmModal(true); }}
                    disabled={runPhaseMutation.isPending}
                    className="flex items-center gap-1 text-[10px]"
                  >
                    <Play className="w-3 h-3" />
                    Run Phase 2
                  </Button>
                )}
                {showPhase3 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => { setPhaseToRun('3'); setShowConfirmModal(true); }}
                    disabled={runPhaseMutation.isPending}
                    className="flex items-center gap-1 text-[10px]"
                  >
                    <Play className="w-3 h-3" />
                    Run Phase 3
                  </Button>
                )}
                {showPhase4 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => { setPhaseToRun('4'); setShowConfirmModal(true); }}
                    disabled={runPhaseMutation.isPending}
                    className="flex items-center gap-1 text-[10px]"
                  >
                    <Play className="w-3 h-3" />
                    Run Phase 4
                  </Button>
                )}
                {showPhase5 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => { setPhaseToRun('5'); setShowConfirmModal(true); }}
                    disabled={runPhaseMutation.isPending}
                    className="flex items-center gap-1 text-[10px]"
                  >
                    <Play className="w-3 h-3" />
                    Run Phase 5
                  </Button>
                )}
                {showHumanCoverOption && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHumanUploadModal(true)}
                    className="flex items-center gap-1 text-[10px]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Skip AI & Upload Cover
                  </Button>
                )}
                {showPhase6 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => { setPhaseToRun('6'); setShowConfirmModal(true); }}
                    disabled={runPhaseMutation.isPending}
                    className="flex items-center gap-1 text-[10px]"
                  >
                    <Play className="w-3 h-3" />
                    Run Phase 6
                  </Button>
                )}
                {showPhase8 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => { setPhaseToRun('8'); setShowConfirmModal(true); }}
                    disabled={runPhaseMutation.isPending}
                    className="flex items-center gap-1 text-[10px]"
                  >
                    <Play className="w-3 h-3" />
                    Run Phase 8
                  </Button>
                )}
                {showPhase10 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => { setPhaseToRun('10'); setShowConfirmModal(true); }}
                    disabled={runPhaseMutation.isPending}
                    className="flex items-center gap-1 text-[10px]"
                  >
                    <Play className="w-3 h-3" />
                    Run Phase 10
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={runNextMutation.isPending || retryMutation.isPending}
                  className="flex items-center gap-1 text-[10px]"
                >
                  <RotateCcw className="w-3 h-3" />
                  Retry Failed Phase
                </Button>
              </div>
            )}

            {/* Manual Stage Override / Reset Stage */}
            <form onSubmit={handleResetStage} className="pt-4 border-t border-[#DED2BE] space-y-3">
              <span className="text-[9px] text-[#5F5A52] font-bold uppercase tracking-widest block font-sans">
                Manual Stage Override / Reset
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Target Stage"
                  options={STAGE_OPTIONS}
                  value={resetStage}
                  onChange={(e) => setResetStage(e.target.value)}
                  placeholder="Select Stage..."
                  size="sm"
                />
                <Select
                  label="Target Status"
                  options={STATUS_OPTIONS}
                  value={resetStatus}
                  onChange={(e) => setResetStatus(e.target.value)}
                  size="sm"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  type="submit"
                  disabled={resetMutation.isPending}
                  size="sm"
                  className="text-[10px]"
                >
                  Apply Override
                </Button>
              </div>
            </form>
          </Card>

          {/* Action Checklist */}
          <Card className="p-6 space-y-4 border border-[#DED2BE] bg-[#FFFDF8]">
            <h3 className="text-xs font-sans font-bold text-[#2A473E] uppercase tracking-widest border-b border-[#DED2BE] pb-3">
              Action Checklist (Human Approvals)
            </h3>

            <div className="space-y-3.5 text-xs">
              {/* Text Layout Checklist item */}
              <div className="flex items-center justify-between p-3.5 bg-[#FAF6EE] rounded border border-[#DED2BE]">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded ${book.text_status === 'approved' ? 'bg-[#3F6F5A]/10 text-[#3F6F5A]' : book.text_status === 'pending_review' ? 'bg-[#B86B3E]/10 text-[#B86B3E]' : 'bg-[#FAF6EE] text-[#5F5A52]'}`}>
                    {book.text_status === 'approved' ? <ShieldCheck className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold block text-[#1A1A1A] font-serif text-sm">Text Layout Review</span>
                    <span className="text-[10px] text-[#5F5A52] font-semibold uppercase tracking-wider font-sans block mt-0.5">Status: {book.text_status}</span>
                  </div>
                </div>
                {book.text_status === 'pending_review' ? (
                  <Link to="/dashboard/review/text">
                    <Button variant="primary" size="sm" className="text-[10px] py-1 h-7">
                      Review Text Layout
                    </Button>
                  </Link>
                ) : (
                  <span className={`text-[10px] font-sans font-bold uppercase tracking-widest ${book.text_status === 'approved' ? 'text-[#3F6F5A]' : 'text-[#5F5A52]'}`}>
                    {book.text_status === 'approved' ? 'Approved' : 'Queue Empty'}
                  </span>
                )}
              </div>

              {/* Cover Checklist item */}
              <div className="flex items-center justify-between p-3.5 bg-[#FAF6EE] rounded border border-[#DED2BE]">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded ${book.cover_status === 'approved' ? 'bg-[#3F6F5A]/10 text-[#3F6F5A]' : book.cover_status === 'pending_review' ? 'bg-[#B86B3E]/10 text-[#B86B3E]' : 'bg-[#FAF6EE] text-[#5F5A52]'}`}>
                    {book.cover_status === 'approved' ? <ShieldCheck className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold block text-[#1A1A1A] font-serif text-sm">Cover Choice Approval</span>
                    <span className="text-[10px] text-[#5F5A52] font-semibold uppercase tracking-wider font-sans block mt-0.5">Status: {book.cover_status}</span>
                  </div>
                </div>
                {book.cover_status === 'pending_review' ? (
                  <Link to="/dashboard/review/covers">
                    <Button variant="primary" size="sm" className="text-[10px] py-1 h-7">
                      Select Cover Choice
                    </Button>
                  </Link>
                ) : (
                  <span className={`text-[10px] font-sans font-bold uppercase tracking-widest ${book.cover_status === 'approved' ? 'text-[#3F6F5A]' : 'text-[#5F5A52]'}`}>
                    {book.cover_status === 'approved' ? 'Approved' : 'Queue Empty'}
                  </span>
                )}
              </div>

              {/* Rights Verification item */}
              <div className="flex items-center justify-between p-3.5 bg-[#FAF6EE] rounded border border-[#DED2BE]">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded ${book.rights_status === 'verified' ? 'bg-[#3F6F5A]/10 text-[#3F6F5A]' : book.rights_status === 'needs_review' ? 'bg-[#B86B3E]/10 text-[#B86B3E]' : 'bg-[#FAF6EE] text-[#5F5A52]'}`}>
                    {book.rights_status === 'verified' ? <ShieldCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold block text-[#1A1A1A] font-serif text-sm">Rights Verification Panel</span>
                    <span className="text-[10px] text-[#5F5A52] font-semibold uppercase tracking-wider font-sans block mt-0.5">Status: {book.rights_status}</span>
                  </div>
                </div>
                {book.rights_status === 'needs_review' ? (
                  <Link to="/dashboard/review/rights">
                    <Button variant="primary" size="sm" className="text-[10px] py-1 h-7">
                      Verify IP Rights
                    </Button>
                  </Link>
                ) : (
                  <span className={`text-[10px] font-sans font-bold uppercase tracking-widest ${book.rights_status === 'verified' ? 'text-[#3F6F5A]' : 'text-[#5F5A52]'}`}>
                    {book.rights_status === 'verified' ? 'Verified' : 'Queue Empty'}
                  </span>
                )}
              </div>

              {/* Catalog Publication (Phase 9) item */}
              {book.current_stage === 'assembled' && book.publication_status === 'ready' && (
                <div className="flex items-center justify-between p-3.5 bg-[#FAF6EE] rounded border border-[#DED2BE]">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-[#3F6F5A]/10 text-[#3F6F5A]">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold block text-[#1A1A1A] font-serif text-sm">Catalog Publication (Phase 9)</span>
                      <span className="text-[10px] text-[#5F5A52] font-semibold uppercase tracking-wider font-sans block mt-0.5">Status: Ready to publish</span>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-[10px] py-1 h-7 bg-[#3F6F5A] hover:bg-[#2A473E] border-none"
                    onClick={handlePublish}
                    disabled={publishMutation.isPending}
                  >
                    Publish Book
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Storage Files Asset List */}
          <Card className="p-6 space-y-4 border border-[#DED2BE] bg-[#FFFDF8]">
            <h3 className="text-xs font-sans font-bold text-[#2A473E] uppercase tracking-widest border-b border-[#DED2BE] pb-3">
              File Assets List (Downloads)
            </h3>
            <BookFilesTable bookId={book.book_id} files={book.files || []} />
          </Card>
        </div>

        {/* Right Column: Tabbed controls integrating all Orphan Components */}
        <div className="space-y-6">
          <Card className="p-6 border border-[#DED2BE] bg-[#FFFDF8] space-y-6">
            {/* Header Tabs */}
            <Tabs
              tabs={detailTabs}
              activeTab={rightActiveTab}
              onTabChange={setRightActiveTab}
            />

            {/* Dynamic Rendering based on Tab */}
            <div className="pt-2">
              {rightActiveTab === 'metadata' && (
                <BookMetadata book={book} onUpdateSuccess={refetchBook} />
              )}
              {rightActiveTab === 'approvals' && (
                <BookApprovals approvalsData={approvalsData || book} />
              )}
              {rightActiveTab === 'qc' && (
                <BookQcReports qcData={qcData || []} />
              )}
              {rightActiveTab === 'compiles' && (
                <BookRenderReports renderData={renderReports || []} />
              )}
              {rightActiveTab === 'chapters' && (
                <BookChapters chapters={book.chapters || []} />
              )}
            </div>
          </Card>
        </div>
      </div>
      <ConfirmDialog
        isOpen={showConfirmModal}
        onClose={() => { setShowConfirmModal(false); setPhaseToRun(null); }}
        onConfirm={() => {
          if (phaseToRun) {
            runPhaseMutation.mutate(phaseToRun);
          }
        }}
        title={`Trigger Phase ${phaseToRun}`}
        message={`Are you sure you want to trigger Phase ${phaseToRun} for this book? This will run the automation workflow.`}
        confirmText="Trigger Phase"
        confirmVariant="primary"
        isLoading={runPhaseMutation.isPending}
      />
      {showHumanUploadModal && (
        <HumanCoverUploadModal
          isOpen={showHumanUploadModal}
          onClose={() => setShowHumanUploadModal(false)}
          book={{ book_id: book.book_id || book.id, title: book.title }}
          currentUser={user}
          onSuccess={() => {
            refetchBook();
          }}
        />
      )}
    </div>
  );
};

export default BookDetailPage;
