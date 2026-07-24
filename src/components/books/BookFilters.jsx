import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Select from '../ui/Select';
import Input from '../ui/Input';
import { RotateCcw } from 'lucide-react';

const BookFilters = ({ search, setSearch }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset to page 1 on filter changes
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handleReset = () => {
    setSearchParams(new URLSearchParams());
    setSearch('');
  };

  const getFilterValue = (key) => searchParams.get(key) || '';

  const STAGE_OPTIONS = [
    { value: 'upload', label: 'Upload' },
    { value: 'normalization', label: 'Normalization' },
    { value: 'structure', label: 'Structure' },
    { value: 'rendering', label: 'Rendering' },
    { value: 'publishing', label: 'Publishing' },
  ];

  const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'complete', label: 'Complete' },
    { value: 'failed', label: 'Failed' },
  ];

  const APPROVAL_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'needs_changes', label: 'Needs Changes' },
  ];

  const PUB_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'unpublished', label: 'Unpublished' },
    { value: 'archived', label: 'Archived' },
  ];

  const TYPE_OPTIONS = [
    { value: 'fiction', label: 'Fiction' },
    { value: 'nonfiction', label: 'Non-Fiction' },
    { value: 'technical', label: 'Technical' },
  ];

  return (
    <div className="glass-panel p-6 rounded-3xl border border-[var(--color-border)] space-y-6 w-full shrink-0 text-left font-sans">
      <div className="flex items-center justify-between border-b border-[var(--color-border)]/50 pb-3">
        <h4 className="text-sm font-bold text-[var(--color-ink)] font-serif uppercase tracking-wider">Search Filters</h4>
        <button
          onClick={handleReset}
          className="text-xs font-bold text-[var(--color-muted-ink)] hover:text-[var(--color-archive-green)] flex items-center gap-1 cursor-pointer transition-colors uppercase tracking-widest"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
        {/* Search */}
        <div className="lg:col-span-1">
          <Input
            label="Search keyword"
            placeholder="Title, author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Current Stage */}
        <div>
          <Select
            label="Current Stage"
            placeholder="All Stages"
            options={STAGE_OPTIONS}
            value={getFilterValue('current_stage')}
            onChange={(e) => handleFilterChange('current_stage', e.target.value)}
          />
        </div>

        {/* Stage Status */}
        <div>
          <Select
            label="Stage Status"
            placeholder="All Statuses"
            options={STATUS_OPTIONS}
            value={getFilterValue('stage_status')}
            onChange={(e) => handleFilterChange('stage_status', e.target.value)}
          />
        </div>

        {/* Text Review */}
        <div>
          <Select
            label="Text Status"
            placeholder="All"
            options={APPROVAL_OPTIONS}
            value={getFilterValue('text_status')}
            onChange={(e) => handleFilterChange('text_status', e.target.value)}
          />
        </div>

        {/* Cover Review */}
        <div>
          <Select
            label="Cover Status"
            placeholder="All"
            options={APPROVAL_OPTIONS}
            value={getFilterValue('cover_status')}
            onChange={(e) => handleFilterChange('cover_status', e.target.value)}
          />
        </div>

        {/* Rights Review */}
        <div>
          <Select
            label="Rights Status"
            placeholder="All"
            options={APPROVAL_OPTIONS}
            value={getFilterValue('rights_status')}
            onChange={(e) => handleFilterChange('rights_status', e.target.value)}
          />
        </div>

        {/* Publication Status */}
        <div>
          <Select
            label="Publication"
            placeholder="All"
            options={PUB_OPTIONS}
            value={getFilterValue('publication_status')}
            onChange={(e) => handleFilterChange('publication_status', e.target.value)}
          />
        </div>

        {/* Work Type */}
        <div>
          <Select
            label="Work Type"
            placeholder="All"
            options={TYPE_OPTIONS}
            value={getFilterValue('work_type')}
            onChange={(e) => handleFilterChange('work_type', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default BookFilters;
