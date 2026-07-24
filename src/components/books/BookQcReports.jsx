import React from 'react';
import StatusBadge from '../ui/StatusBadge';
import { CheckCircle } from 'lucide-react';

/**
 * QC Reports tab view displaying automated sanity checks
 */
const BookQcReports = ({ qcData }) => {
  const reports = Array.isArray(qcData) ? qcData : (qcData ? [qcData] : []);

  return (
    <div className="space-y-6 text-left font-sans">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-[var(--color-ink)] font-serif uppercase tracking-wider">Automated QC Suite</h3>
        <span className="text-xs text-[var(--color-muted-ink)] font-bold uppercase tracking-widest text-[9px]">Telemetry logs</span>
      </div>

      <div className="space-y-4">
        {reports.length > 0 ? (
          reports.map((report, i) => (
            <div key={i} className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-ink)]">{report.check_name || 'Sanity Audit Run'}</h4>
                  <p className="text-xs text-[var(--color-muted-ink)] mt-0.5">Category: {report.category || 'General'}</p>
                </div>
                <StatusBadge status={report.status || report.result} />
              </div>

              {report.message && (
                <div className={`p-4 rounded-xl text-xs font-serif ${
                  ['failed', 'error'].includes(String(report.status).toLowerCase())
                    ? 'bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/20 text-[var(--color-danger)] font-semibold'
                    : 'bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-ink-soft)]'
                }`}>
                  <span className="font-bold block mb-1 uppercase tracking-widest text-[9px] font-sans">Details:</span>
                  {report.message}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-[var(--color-subtle-ink)] pt-2 border-t border-[var(--color-border)]/40">
                <div>
                  <span className="text-[9px] uppercase tracking-widest font-bold">Evaluator Node:</span>
                  <span className="block text-[var(--color-ink)] font-bold mt-0.5">{report.evaluator_node || 'Runner 1'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest font-bold">Validation Date:</span>
                  <span className="block text-[var(--color-ink)] font-bold mt-0.5">
                    {report.checked_at ? new Date(report.checked_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-[var(--color-panel)]/40 border border-[var(--color-border)] rounded-2xl text-[var(--color-subtle-ink)] text-xs">
            <CheckCircle className="w-8 h-8 text-[var(--color-subtle-ink)]/55 mx-auto mb-2" />
            No automated QC runs registered for this book compilation.
          </div>
        )}
      </div>
    </div>
  );
};

export default BookQcReports;
