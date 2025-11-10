import React from 'react';

interface ConfirmModalProps {
  show: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({ show, message, onConfirm, onCancel, confirmText = 'Confirmer', cancelText = 'Annuler' }: ConfirmModalProps) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-xl max-w-sm w-full relative flex flex-col items-center">
        <div className="text-lg font-semibold text-center mb-6">{message}</div>
        <div className="flex gap-4 justify-center">
          <button onClick={onCancel} className="bg-gray-300 text-gray-800 px-4 py-2 rounded font-semibold hover:bg-gray-400 transition">{cancelText}</button>
          <button onClick={onConfirm} className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 transition">{confirmText}</button>
        </div>
      </div>
    </div>
  );
} 
