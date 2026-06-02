import React from 'react';
import Modal from './Modal';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) {
  const confirmButtonClass =
    type === 'danger'
      ? 'bg-rose-500 hover:bg-rose-600 focus:ring-rose-500'
      : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${confirmButtonClass}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
}
