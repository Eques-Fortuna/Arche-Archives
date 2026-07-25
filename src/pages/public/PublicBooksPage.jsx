import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPublicBooks } from '../../lib/api';

// Components
import Select from '../../components/ui/Select';
import PublicBookCard from '../../components/public/PublicBookCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import Card from '../../components/ui/Card';
import { Search, BookOpen } from 'lucide-react';

const PublicBooksPage = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [page, setPage] = useState(1);

  // TanStack Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['publicBooksCatalog'],
    queryFn: () => getPublicBooks(),
  });

  const filteredBooks = useMemo(() => {
    // If backend returns data or data.items
    let list = [];
    if (data) {
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data.items)) list = data.items;
      else if (Array.isArray(data.books)) list = data.books;
    }

    // Fallback static items if DB is currently empty for testing
    if (list.length === 0 && !isLoading && !error) {
      list = [
        { book_id: '1', title: 'The Echoes of Antiquity', author: 'Marcus Aurelius Thorne', slug: 'echoes-of-antiquity', work_type: 'Philosophy', description: 'A profound exploration of lost Stoic fragments discovered in the subterranean vaults.' },
        { book_id: '2', title: 'Celestial Mechanics', author: 'Dr. Helena Vance', slug: 'celestial-mechanics', work_type: 'Science', description: 'Tracing the evolution of astronomical notation from 15th-century woodcuts.' },
        { book_id: '3', title: 'The Last Archivist', author: 'Julian S. Penhaligon', slug: 'last-archivist', work_type: 'Fiction', description: 'A haunting fictional narrative set in a crumbling coastal manor where a recluse librarian discovers a manuscript.' },
        { book_id: '4', title: 'De Natura Rerum', author: 'Lucretius (Annotated)', slug: 'de-natura-rerum', work_type: 'Latin', description: 'A definitive digital transcription of the 1612 Parisian edition, complete with exhaustive marginalia.' },
        { book_id: '5', title: 'The Ethics of Info', author: 'Prof. Alistair Kaye', slug: 'ethics-of-info', work_type: 'Philosophy', description: 'A critical investigation into the preservation of digital artifacts.' },
        { book_id: '6', title: "Chroniques de l'Ombre", author: 'Elise Beaumont', slug: 'chroniques-de-l-ombre', work_type: 'French', description: 'A collection of rare short stories from the Belle Époque, translated and meticulously restored.' }
      ];
    }

    // Search keyword
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          (b.title && b.title.toLowerCase().includes(q)) ||
          (b.author && b.author.toLowerCase().includes(q))
      );
    }

    // Work type filter
    if (typeFilter) {
      list = list.filter((b) => String(b.work_type).toLowerCase() === typeFilter.toLowerCase());
    }

    // Language filter
    if (langFilter) {
      list = list.filter((b) => String(b.language || 'english').toLowerCase() === langFilter.toLowerCase());
    }

    return list;
  }, [data, search, typeFilter, langFilter, isLoading, error]);

  // Paginated elements
  const itemsPerPage = 7; // Leaving 1 spot for the mockup placeholder card!
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage) || 1;
  const currentPage = Math.min(page, totalPages);

  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBooks.slice(start, start + itemsPerPage);
  }, [filteredBooks, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const TYPE_OPTIONS = [
    { value: 'fiction', label: 'Fiction' },
    { value: 'nonfiction', label: 'Non-Fiction' },
    { value: 'technical', label: 'Technical' },
    { value: 'philosophy', label: 'Philosophy' },
    { value: 'science', label: 'Science' },
  ];

  const LANG_OPTIONS = [
    { value: 'english', label: 'English' },
    { value: 'french', label: 'French' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'latin', label: 'Latin' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-8 bg-[#FAF6EE] text-[var(--color-ink)] font-sans text-left">
      {/* Header section */}
      <div className="border-b border-[var(--color-border)] pb-6">
        <span className="px-2 py-0.5 bg-[var(--color-warning-soft)] border border-[var(--color-warning)]/20 text-[9px] font-bold text-[var(--color-warning)] uppercase tracking-widest rounded mb-3 inline-block">
          Public Release
        </span>
        <h1 className="text-4xl font-bold text-[var(--color-archive-green)] font-serif leading-tight">Arche Archives Library</h1>
        <p className="text-sm text-[var(--color-muted-ink)] max-w-3xl mt-2 font-serif leading-relaxed">
          "Preserving the intellectual heritage of humanity through meticulous digital curation. Explore our curated selection of physical manuscripts and rare editions, now accessible for universal scholarly inquiry."
        </p>
      </div>

      {/* Filter panel mockup exactly as shown in screenshot 4 */}
      <Card className="p-5 border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs">
          <div className="md:col-span-2 space-y-1">
            <span className="text-[9px] text-[var(--color-muted-ink)] font-bold uppercase tracking-widest block">Search Catalogs</span>
            <div className="relative">
              <input
                type="text"
                placeholder="Title, Author, or Keyword..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-3 pr-9 py-2 bg-[var(--color-panel)] border border-[var(--color-border)] rounded text-xs text-[var(--color-ink)] placeholder-[var(--color-muted-ink)]/50 focus:outline-none focus:border-[var(--color-archive-green)]"
              />
              <Search className="absolute right-3 top-2.5 w-3.5 h-3.5 text-[var(--color-muted-ink)]" />
            </div>
          </div>

          <Select
            label="Genre"
            placeholder="All Genres"
            options={TYPE_OPTIONS}
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            size="sm"
          />

          <Select
            label="Language"
            placeholder="All Languages"
            options={LANG_OPTIONS}
            value={langFilter}
            onChange={(e) => {
              setLangFilter(e.target.value);
              setPage(1);
            }}
            size="sm"
          />
        </div>
      </Card>

      {/* Content grid */}
      {paginatedBooks.length > 0 ? (
        <div className="space-y-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {paginatedBooks.map((book) => (
              <PublicBookCard key={book.book_id || book.id} book={book} />
            ))}

            {/* Dynamic catalog placeholder card from mockup 4 */}
            {paginatedBooks.length < 8 && (
              <div className="border border-dashed border-[var(--color-border)] rounded-2xl p-6 bg-[var(--color-panel)]/40 flex flex-col items-center justify-center text-center gap-3 select-none h-full min-h-[380px]">
                <BookOpen className="w-10 h-10 text-[var(--color-subtle-ink)]/25" />
                <div>
                  <h4 className="font-serif font-bold text-sm text-[var(--color-muted-ink)] leading-tight">Restoring Catalog</h4>
                  <span className="text-[10px] text-[var(--color-subtle-ink)] font-bold uppercase tracking-wider block mt-1">Available Fall 2026</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Mock Pagination styled exactly as shown in screenshot 4 */}
          <div className="border-t border-[var(--color-border)] pt-6 flex items-center justify-center gap-6 text-xs select-none">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="font-bold text-[var(--color-muted-ink)] hover:text-[var(--color-archive-green)] disabled:opacity-40 uppercase tracking-widest cursor-pointer"
            >
              ← Previous Folio
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-7 h-7 flex items-center justify-center font-mono font-bold border transition-all rounded-xl cursor-pointer ${
                    currentPage === i + 1
                      ? 'bg-[var(--color-archive-green)] border-[var(--color-archive-green)] text-[var(--color-surface)] shadow-sm'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-panel)]'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')}
                </button>
              ))}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="font-bold text-[var(--color-muted-ink)] hover:text-[var(--color-archive-green)] disabled:opacity-40 uppercase tracking-widest cursor-pointer"
            >
              Next Folio →
            </button>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Books Found"
          description="We couldn't find any published works matching your search parameters."
        />
      )}
    </div>
  );
};

export default PublicBooksPage;
