import React from 'react';
import PublicBookCard from './PublicBookCard';

/**
 * Reusable grid mapping catalog lists onto Book cards
 */
const PublicBookGrid = ({ books = [] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {books.map((book, index) => (
        <PublicBookCard key={book.slug || book.id || index} book={book} />
      ))}
    </div>
  );
};

export default PublicBookGrid;
