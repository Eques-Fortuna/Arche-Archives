import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getAdminRightsReviewQueue,
  approveRightsReview,
  rejectRightsReview
} from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import RightsReviewForm from '../../components/review/RightsReviewForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';

const RightsReviewPage = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Query Queue
  const { data: queue, isLoading, error, refetch } = useQuery({
    queryKey: ['rightsReviewQueue'],
    queryFn: () => getAdminRightsReviewQueue(),
  });

  // Action Mutations
  const actionMutation = useMutation({
    mutationFn: async ({ bookId, type, payload }) => {
      if (type === 'approve') {
        return approveRightsReview(bookId, payload);
      } else {
        return rejectRightsReview(bookId, payload);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rightsReviewQueue'] });
      toast.success(`Rights review decision [${variables.type}] recorded!`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit rights review.');
    },
  });

  const handleActionSubmit = (bookId, type, payload) => {
    actionMutation.mutate({ bookId, type, payload });
  };

  if (isLoading) {
    return <LoadingSpinner message="Retrieving pending rights clearance catalog queue..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Review Queue"
        description="Could not synchronize queue telemetry datasets with the server."
        onRetry={refetch}
      />
    );
  }

  const books = Array.isArray(queue) ? queue : [];

  return (
    <div className="space-y-6 w-full">
      <div className="text-left">
        <h2 className="text-2xl font-bold text-[var(--color-archive-green)] font-serif">Intellectual Property & Rights Review</h2>
        <p className="text-xs text-[var(--color-muted-ink)] mt-1">Audit copyright status, public domains arguments, and source cataloging logs.</p>
      </div>

      {books.length > 0 ? (
        <div className="space-y-6">
          {books.map((book) => (
            <RightsReviewForm
              key={book.book_id || book.id}
              book={book}
              currentUser={currentUser}
              onAction={handleActionSubmit}
              isPending={actionMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No books waiting for rights review."
          description=""
        />
      )}
    </div>
  );
};

export default RightsReviewPage;
