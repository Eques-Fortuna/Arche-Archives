import React from 'react';
import StatusBadge from '../ui/StatusBadge';
import { Terminal, CheckCircle2 } from 'lucide-react';

/**
 * Render Reports tab view showing compiler terminal logs
 */
const BookRenderReports = ({ renderData }) => {
  const reports = Array.isArray(renderData) ? renderData : (renderData ? [renderData] : []);

  return (
    <div className="space-y-6 text-left font-sans">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-[var(--color-ink)] font-serif uppercase tracking-wider">PDF Compiling Telemetry</h3>
        <span className="text-xs text-[var(--color-muted-ink)] font-bold uppercase tracking-widest text-[9px]">Compiler Logs</span>
      </div>

      <div className="space-y-4">
        {reports.length > 0 ? (
          reports.map((report, i) => (
            <div key={i} className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-ink)]">{report.engine_name || 'XeLaTeX Layout Compiler'}</h4>
                  <p className="text-xs text-[var(--color-muted-ink)] mt-0.5">Format output: {report.target_format || 'PDF'}</p>
                </div>
                <StatusBadge status={report.status} />
              </div>

              {/* Warnings / Errors indicators */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-[var(--color-panel)] rounded-xl flex justify-between items-center">
                  <span className="text-[var(--color-muted-ink)] font-semibold">Compiler Warnings:</span>
                  <span className={`font-mono font-bold ${report.warning_count > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-ink-soft)]'}`}>
                    {report.warning_count || 0}
                  </span>
                </div>
                <div className="p-3 bg-[var(--color-panel)] rounded-xl flex justify-between items-center">
                  <span className="text-[var(--color-muted-ink)] font-semibold">Fatal Errors:</span>
                  <span className={`font-mono font-bold ${report.error_count > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-ink-soft)]'}`}>
                    {report.error_count || 0}
                  </span>
                </div>
              </div>

              {/* Raw Console Logs snippet */}
              {report.console_log && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-[var(--color-muted-ink)] uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <Terminal className="w-3.5 h-3.5 text-[var(--color-archive-green)]" />
                    stdout.log
                  </span>
                  <pre className="p-4 bg-[var(--color-code-bg)] rounded-xl border border-[var(--color-border)]/35 font-mono text-[10px] sm:text-xs text-[var(--color-code-text)] overflow-x-auto leading-relaxed max-h-60 overflow-y-auto select-all">
                    {report.console_log}
                  </pre>
                </div>
              )}

              <div className="text-xs text-[var(--color-subtle-ink)] pt-2 border-t border-[var(--color-border)]/40">
                <span className="text-[9px] uppercase tracking-widest font-bold">Duration:</span>
                <span className="text-[var(--color-ink)] font-bold ml-1">{report.compile_time_ms ? `${(report.compile_time_ms / 1000).toFixed(2)}s` : 'N/A'}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-[var(--color-panel)]/40 border border-[var(--color-border)] rounded-2xl text-[var(--color-subtle-ink)] text-xs">
            <CheckCircle2 className="w-8 h-8 text-[var(--color-subtle-ink)]/55 mx-auto mb-2" />
            No active compilation logs registered for this book record.
          </div>
        )}
      </div>
    </div>
  );
};

export default BookRenderReports;
