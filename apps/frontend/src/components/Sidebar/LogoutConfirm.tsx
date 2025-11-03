import React, { useState } from 'react';

interface LogoutConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

const LogoutConfirm: React.FC<LogoutConfirmProps> = ({ isOpen, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => !loading && onClose()} />

      <div className="relative z-10 w-[92%] max-w-md rounded-2xl bg-white shadow-xl">
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">Confirm log out</h3>
          <p className="mt-2 text-sm text-gray-600">Are you sure you want to log out?</p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-textSecondary hover:bg-gray-100 disabled:opacity-60"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirm;
