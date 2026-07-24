import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';

/**
 * Reusable modal for recovery queue comments entry
 */
const RecoveryActionModal = ({ isOpen, onClose, onConfirm, isPending }) => {
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ notes });
    setNotes('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mark Ready to Retry" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Textarea
          label="Mark Ready Notes"
          placeholder="Describe how the issue was fixed..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          required
          rows={3}
        />
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending} size="sm">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isPending} size="sm">
            {isPending ? 'Marking...' : 'Mark Ready'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecoveryActionModal;
