import React from 'react';
import { FileText, Clock } from 'lucide-react';

/**
 * Reusable Chapters table showing chapters/sections hierarchy
 */
const BookChapters = ({ chapters = [] }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-3 border-b border-white/5">
        <h3 className="text-base font-bold text-white uppercase tracking-wider">Chapters & Sections Table</h3>
        <span className="text-xs text-slate-400">{chapters.length} items</span>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-slate-900/60">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Chapter / Section</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Title</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Word Count</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Sequence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {chapters.length > 0 ? (
                chapters.map((chapter, i) => (
                  <tr key={chapter.id || i} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4 align-middle font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <span>Chapter {chapter.chapter_number || i + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle text-slate-300">
                      {chapter.title || 'Untitled Chapter'}
                    </td>
                    <td className="px-6 py-4 align-middle text-xs text-slate-400 font-mono">
                      {chapter.word_count ? chapter.word_count.toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 align-middle text-xs text-slate-400 font-mono text-right">
                      Seq #{chapter.sequence_order || i + 1}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-slate-500">
                    No chapter divisions registered for this book manuscript.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookChapters;
