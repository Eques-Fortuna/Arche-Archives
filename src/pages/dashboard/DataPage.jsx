import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminBooks } from '../../lib/api';
import toast from 'react-hot-toast';

// Components
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import { Database, Package, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

const DataPage = () => {
  // Query books catalog to evaluate data packaging statuses
  const { data: books, isLoading, error, refetch } = useQuery({
    queryKey: ['adminBooksDataPackaging'],
    queryFn: () => getAdminBooks(),
  });

  const booksList = Array.isArray(books) ? books : [];

  // Calculate package distributions
  const packagedCount = booksList.filter((b) => String(b.data_status || '').toLowerCase() === 'packaged').length;
  const pendingCount = booksList.filter((b) => !b.data_status || String(b.data_status).toLowerCase() === 'pending').length;
  const failedCount = booksList.filter((b) => String(b.data_status).toLowerCase() === 'failed').length;
  const publicCount = booksList.filter((b) => String(b.publication_status).toLowerCase() === 'published').length;

  const handleComingSoon = (actionName) => {
    toast(`"${actionName}" feature is coming soon!`, {
      icon: '🚀',
      style: {
        background: 'var(--color-surface)',
        color: 'var(--color-ink)',
        border: '1px solid var(--color-border)',
      },
    });
  };

  if (isLoading) {
    return <LoadingSpinner message="Retrieving data platform metrics..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Data Dashboard"
        description="Could not synchronize catalog datasets stats with the server."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6 w-full text-left font-sans text-[var(--color-ink)]">
      {/* Header and Explanation */}
      <Card className="p-6 sm:p-8 relative overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--color-archive-green-soft)]/20 rounded-full blur-3xl" />
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-archive-green-soft)] text-[var(--color-archive-green)] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            AI & NLP Dataset Hub
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-ink)] font-serif">Arche Archives Data Products</h2>
          <p className="text-xs sm:text-sm text-[var(--color-muted-ink)] leading-relaxed font-serif">
            Arche Archives packages clean, structured public domain works into high-fidelity training datasets. In the future, this page will let you generate semantic embeddings, export paragraphs/sentences chunks, run Entity Recognitions (NER), and download structured training sets.
          </p>
        </div>
      </Card>

      {/* Triaged Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-5 flex items-center gap-4 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
          <div className="p-3 bg-[var(--color-archive-green-soft)] text-[var(--color-archive-green)] rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-muted-ink)] font-bold uppercase tracking-wider block">Packaged Books</span>
            <span className="text-2xl font-bold text-[var(--color-ink)] font-serif mt-1 block">{packagedCount}</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
          <div className="p-3 bg-[var(--color-warning-soft)] text-[var(--color-warning)] rounded-xl">
            <Database className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-muted-ink)] font-bold uppercase tracking-wider block">Pending Curation</span>
            <span className="text-2xl font-bold text-[var(--color-ink)] font-serif mt-1 block">{pendingCount}</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
          <div className="p-3 bg-[var(--color-danger-soft)] text-[var(--color-danger)] rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-muted-ink)] font-bold uppercase tracking-wider block">Failed Packaging</span>
            <span className="text-2xl font-bold text-[var(--color-ink)] font-serif mt-1 block">{failedCount}</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
          <div className="p-3 bg-[var(--color-panel-deep)]/40 text-[var(--color-ink-soft)] rounded-xl">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-muted-ink)] font-bold uppercase tracking-wider block">Public API Feeds</span>
            <span className="text-2xl font-bold text-[var(--color-ink)] font-serif mt-1 block">{publicCount}</span>
          </div>
        </Card>
      </div>

      {/* Placeholder Buttons and Catalog Status */}
      <Card className="p-6 space-y-6 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-ink)] font-serif uppercase tracking-wider">Dataset Operations</h3>
          <p className="text-xs text-[var(--color-muted-ink)] mt-1">Actions below are deactivated during pre-release staging.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button
            variant="outline"
            onClick={() => handleComingSoon('View Data Package')}
            title="Coming soon"
            className="text-[var(--color-subtle-ink)] border-[var(--color-border)] bg-[var(--color-panel)]/30 hover:bg-[var(--color-panel)] cursor-pointer"
          >
            View Data Package
          </Button>

          <Button
            variant="outline"
            onClick={() => handleComingSoon('Package Data')}
            title="Coming soon"
            className="text-[var(--color-subtle-ink)] border-[var(--color-border)] bg-[var(--color-panel)]/30 hover:bg-[var(--color-panel)] cursor-pointer"
          >
            Package Data
          </Button>

          <Button
            variant="outline"
            onClick={() => handleComingSoon('Search Chunks')}
            title="Coming soon"
            className="text-[var(--color-subtle-ink)] border-[var(--color-border)] bg-[var(--color-panel)]/30 hover:bg-[var(--color-panel)] cursor-pointer"
          >
            Search Chunks
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DataPage;
