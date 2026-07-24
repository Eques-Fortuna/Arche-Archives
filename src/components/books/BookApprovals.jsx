import React from 'react';
import StatusBadge from '../ui/StatusBadge';
import { formatDate } from '../../lib/formatters';
import { ShieldCheck, User, Calendar, FileText } from 'lucide-react';

/**
 * BookApprovals tab view displaying reviewer audit stamps
 */
const BookApprovals = ({ approvalsData }) => {
  const approvals = approvalsData || {};

  const auditItems = [
    {
      title: 'Text Composition Approval',
      status: approvals.text_status || 'pending',
      reviewer: approvals.text_reviewer_name,
      email: approvals.text_reviewer_email,
      date: approvals.text_approved_at,
      notes: approvals.text_review_notes,
    },
    {
      title: 'Cover Design Approval',
      status: approvals.cover_status || 'pending',
      reviewer: approvals.cover_reviewer_name,
      email: approvals.cover_reviewer_email,
      date: approvals.cover_approved_at,
      notes: approvals.cover_review_notes,
    },
    {
      title: 'Rights Clearance Verification',
      status: approvals.rights_status || 'pending',
      reviewer: approvals.rights_reviewer_name,
      email: approvals.rights_reviewer_email,
      date: approvals.rights_approved_at,
      notes: approvals.rights_review_notes,
    },
  ];

  return (
    <div className="space-y-6 text-left font-sans">
      <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
        <h3 className="text-base font-bold text-[var(--color-ink)] font-serif uppercase tracking-wider">Review Audits & Approvals</h3>
        <span className="text-xs text-[var(--color-muted-ink)] font-bold uppercase tracking-widest text-[9px]">Security Stamps</span>
      </div>

      <div className="space-y-6">
        {auditItems.map((item, i) => (
          <div key={i} className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="text-sm font-bold text-[var(--color-ink)] flex items-center gap-2">
                <ShieldCheck className={`w-4.5 h-4.5 ${
                  ['approved', 'verified', 'complete'].includes(String(item.status).toLowerCase())
                    ? 'text-[var(--color-success)]'
                    : 'text-[var(--color-subtle-ink)]'
                }`} />
                {item.title}
              </h4>
              <StatusBadge status={item.status} />
            </div>

            {['approved', 'verified', 'complete', 'rejected', 'needs_changes'].includes(String(item.status).toLowerCase()) ? (
              <div className="space-y-3 pt-2 border-t border-[var(--color-border)]/40">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-2 text-[var(--color-muted-ink)]">
                    <User className="w-3.5 h-3.5 text-[var(--color-archive-green)] shrink-0" />
                    <span>Reviewer: <strong className="text-[var(--color-ink)] font-bold">{item.reviewer || 'N/A'}</strong> ({item.email || 'N/A'})</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--color-muted-ink)]">
                    <Calendar className="w-3.5 h-3.5 text-[var(--color-archive-green)] shrink-0" />
                    <span>Timestamp: <strong className="text-[var(--color-ink)] font-bold">{formatDate(item.date)}</strong></span>
                  </div>
                </div>

                {item.notes && (
                  <div className="p-3.5 rounded-xl bg-[var(--color-panel)] border border-[var(--color-border)] text-xs text-[var(--color-ink)] space-y-1">
                    <span className="font-bold text-[var(--color-muted-ink)] block flex items-center gap-1 uppercase tracking-widest text-[9px]">
                      <FileText className="w-3.5 h-3.5" />
                      Reviewer Notes:
                    </span>
                    <p className="leading-relaxed font-serif text-[var(--color-ink-soft)]">{item.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-subtle-ink)] italic pt-2 border-t border-[var(--color-border)]/40">
                This verification phase has not been executed yet.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookApprovals;
