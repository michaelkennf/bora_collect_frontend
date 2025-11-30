import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface SuccessNotificationProps {
  show: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning';
  onClose: () => void;
  duration?: number;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  show,
  message,
  type = 'success',
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  const icons = {
    success: <CheckCircle className="h-6 w-6 text-green-500" />,
    error: <XCircle className="h-6 w-6 text-red-500" />,
    warning: <AlertCircle className="h-6 w-6 text-orange-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-orange-50 border-orange-200',
  };

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-orange-800',
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div
        className={`${bgColors[type]} ${textColors[type]} border-2 rounded-xl shadow-2xl p-4 min-w-[320px] max-w-md flex items-start gap-3`}
      >
        <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
        <div className="flex-1">
          <p className="font-semibold text-sm leading-relaxed">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SuccessNotification;

