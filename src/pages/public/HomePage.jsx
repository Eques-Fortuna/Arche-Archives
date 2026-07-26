import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublicBooks } from '../../lib/api';
import PublicBookCard from '../../components/public/PublicBookCard';
import { ArrowRight, Zap, Shield, Award, Compass } from 'lucide-react';

const HomePage = () => {
  // Query latest books via public API
  const { data: booksData } = useQuery({
    queryKey: ['publicLatestBooks'],
    queryFn: () => getPublicBooks({ limit: 4 }),
  });

  const latestBooks = React.useMemo(() => {
    const list = Array.isArray(booksData) ? booksData : [];
    return list
      .filter((b) => String(b.publication_status).toLowerCase() === 'published' || String(b.publicationStatus).toLowerCase() === 'published')
      .slice(0, 4);
  }, [booksData]);

  return (
    <div className="flex flex-col items-center justify-center w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8 space-y-20 bg-[#FAF6EE] text-[#1A1A1A]">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto space-y-6 select-none">
        <span className="text-[10px] text-[var(--color-warning)] font-bold uppercase tracking-widest font-sans">
          Custodians of Human Knowledge
        </span>

        <h1 className="text-4xl sm:text-6xl font-bold font-serif leading-tight text-[#2A473E]">
          Preserving History
          <br />
          through Precision.
        </h1>

        <p className="text-sm sm:text-base text-[#5F5A52] max-w-2xl mx-auto leading-relaxed font-serif">
          Welcome to a premium digital sanctuary where centuries-old manuscripts meet state-of-the-art automated restoration.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/books"
            className="flex items-center justify-center gap-2 px-8 py-3 rounded bg-[#2A473E] hover:bg-[#1E342D] text-[#FAF6EE] font-bold text-xs uppercase tracking-widest shadow-sm transition-all duration-200 w-full sm:w-auto"
          >
            Browse the Library
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 px-8 py-3 rounded border border-[#2A473E] hover:bg-[#2A473E]/5 text-[#2A473E] font-bold text-xs uppercase tracking-widest transition-all duration-200 w-full sm:w-auto"
          >
            The Restoration Process
          </Link>
        </div>
      </div>

      {/* Center split info layout mapping image mockup 3 */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-8 border-t border-[#DED2BE]">
        {/* Left Column: Scriptorium Description */}
        <div className="space-y-6 text-left">
          <span className="text-[9px] text-[#5F5A52] font-bold uppercase tracking-widest block font-sans">The Scriptorium</span>
          <h2 className="text-3xl font-bold text-[#2A473E] font-serif leading-tight">Digital Alchemy</h2>
          <p className="text-sm text-[#5F5A52] font-serif leading-relaxed text-justify">
            At the heart of Arche Archives lies <strong>The Scriptorium</strong>, a revolutionary suite of digital restoration tools designed to breathe life back into decaying texts without losing the soul of the original scribe. Our proprietary Digital Alchemy engine uses high-fidelity neural networks to isolate ink from paper, compensating for fading, water damage, and structural degradation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-[#FFFDF8] border border-[#DED2BE] rounded space-y-2">
              <Zap className="w-5 h-5 text-[var(--color-warning)]" />
              <h4 className="font-serif font-bold text-sm text-[#1A1A1A]">Automated Restoration</h4>
              <p className="text-[11px] text-[#5F5A52] leading-normal font-serif">
                Real-time correction of digital decay while maintaining original ink textures.
              </p>
            </div>
            <div className="p-5 bg-[#FFFDF8] border border-[#DED2BE] rounded space-y-2">
              <Compass className="w-5 h-5 text-[var(--color-warning)]" />
              <h4 className="font-serif font-bold text-sm text-[#1A1A1A]">Non-Invasive Scans</h4>
              <p className="text-[11px] text-[#5F5A52] leading-normal font-serif">
                Zero-contact high-resolution capture that respects fragile physical bindings.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Generated manuscript image */}
        <div className="aspect-[3/2] rounded border border-[#DED2BE] overflow-hidden bg-[#FFFDF8] shadow-sm select-none">
          <img
            src="/manuscript.jpg"
            alt="Illuminated manuscript"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Featured Releases Catalog Grid */}
      <div className="max-w-6xl mx-auto w-full space-y-8 pt-8 border-t border-[#DED2BE] text-left">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[9px] text-[#5F5A52] font-bold uppercase tracking-widest block font-sans">Curated Collections</span>
            <h2 className="text-3xl font-bold text-[#2A473E] font-serif mt-1">Featured Volumes</h2>
          </div>
          <Link
            to="/books"
            className="text-xs font-bold text-[#5F5A52] hover:text-[#2A473E] uppercase tracking-widest flex items-center gap-1 font-sans"
          >
            View Entire Archive
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {latestBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestBooks.map((book) => (
              <PublicBookCard key={book.book_id || book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-[#DED2BE] bg-[#FFFDF8] text-center text-xs text-[#5F5A52] font-serif select-none w-full">
            No public releases yet.
          </div>
        )}
      </div>

      {/* Compliance / Partner Badges */}
      <div className="max-w-6xl mx-auto w-full pt-8 border-t border-[#DED2BE] flex flex-col sm:flex-row justify-center items-center gap-8 select-none">
        <div className="flex items-center gap-2 px-4 py-2 bg-[#FFFDF8] border border-[#DED2BE] rounded">
          <Shield className="w-4 h-4 text-[#3F6F5A]" />
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#5F5A52]">OAI-PMH Compliant</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#FFFDF8] border border-[#DED2BE] rounded">
          <Award className="w-4 h-4 text-[#3F6F5A]" />
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#5F5A52]">UNESCO Partner</span>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
