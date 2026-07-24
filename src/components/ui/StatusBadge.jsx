import React from 'react';
import Badge from './Badge';

/**
 * Reusable StatusBadge mapping backend states to styled Badge tag configurations
 */
const StatusBadge = ({ status, className = '', ...props }) => {
  const getStatusConfig = (statusKey) => {
    if (!statusKey) return { label: 'N/A', variant: 'neutral' };
    const key = String(statusKey).toLowerCase().trim().replace(/[\s-]/g, '_');
    
    switch (key) {
      case 'pending':
        return { label: 'Pending', variant: 'warning' };
      case 'in_progress':
      case 'processing':
        return { label: 'In Progress', variant: 'primary' };
      case 'complete':
      case 'completed':
      case 'verified':
        return { label: 'Complete', variant: 'success_soft' };
      case 'failed':
      case 'error':
      case 'rejected':
        return { label: 'Failed', variant: 'danger' };
      case 'blocked':
        return { label: 'Blocked', variant: 'danger_dark' };
      case 'needs_review':
      case 'pending_review':
      case 'needs_changes':
        return { label: 'Needs Review', variant: 'warning' };
      case 'approved':
      case 'reviewed':
        return { label: 'Approved', variant: 'success' };
      case 'published':
        return { label: 'Published', variant: 'published' };
      default:
        // Format word nicely
        const cleanLabel = statusKey.charAt(0).toUpperCase() + statusKey.slice(1).toLowerCase().replace(/_/g, ' ');
        return { label: cleanLabel, variant: 'neutral' };
    }
  };

  const { label, variant } = getStatusConfig(status);

  return (
    <Badge variant={variant} className={className} {...props}>
      {label}
    </Badge>
  );
};

export default StatusBadge;
