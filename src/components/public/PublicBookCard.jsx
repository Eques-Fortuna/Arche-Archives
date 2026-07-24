import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, User } from 'lucide-react';

/**
 * Reusable Card component for public catalogs
 */
const PublicBookCard = ({ book }) => {
  const slug = book.slug || 'unknown';
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group bg-[#FFFDF8] border border-[#DED2BE] rounded shadow-sm hover:border-[#2A473E] hover:shadow-md transition-all duration-300 flex flex-col h-full overflow-hidden select-none">
      {/* Cover representation */}
      <div className="h-64 sm:h-72 bg-[#FAF6EE] border-b border-[#DED2BE] relative flex items-center justify-center overflow-hidden">
        {book.cover_url && !imageError ? (
          <img
            src={book.cover_url}
            alt={`${book.title} cover`}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="space-y-3 z-10 text-center p-6">
            <BookOpen className="w-10 h-10 text-[#2A473E]/45 mx-auto transition-transform duration-500 group-hover:scale-110" />
            <h5 className="text-sm font-bold font-serif text-[#1A1A1A] line-clamp-2 max-w-[160px] mx-auto">{book.title}</h5>
            <p className="text-[10px] text-[#5F5A52] font-semibold uppercase tracking-wider truncate max-w-[140px] mx-auto">By {book.author}</p>
          </div>
        )}
      </div>

      {/* Description Excerpt & action */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-[#FFFDF8]">
        <div className="space-y-2">
          <h4 className="text-base font-bold font-serif text-[#1A1A1A] group-hover:text-[#2A473E] transition-colors truncate">
            {book.title}
          </h4>
          <p className="text-xs font-semibold text-[#5F5A52] uppercase tracking-wider font-sans">
            {book.author}
          </p>
          {book.description && (
            <p className="text-xs text-[#5F5A52] line-clamp-3 leading-relaxed font-serif">
              {book.description}
            </p>
          )}
        </div>

        {/* Footer controls inside card */}
        <div className="pt-2 border-t border-[#DED2BE]/40 flex items-center justify-between">
          <span className="px-2 py-0.5 rounded bg-[#FAF6EE] text-[9px] text-[#5F5A52] font-mono border border-[#DED2BE] uppercase tracking-widest">
            {book.work_type || book.workType || 'Philosophy'}
          </span>
          
          <Link
            to={`/books/${slug}`}
            className="text-[10px] font-sans font-bold text-[#5F5A52] hover:text-[#2A473E] uppercase tracking-widest cursor-pointer"
          >
            Details →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PublicBookCard;
