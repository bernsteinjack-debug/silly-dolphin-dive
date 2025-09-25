import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning'
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
      border: 'border-red-200'
    },
    warning: {
      icon: 'text-yellow-500',
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      border: 'border-yellow-200'
    },
    info: {
      icon: 'text-blue-500',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
      border: 'border-blue-200'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-md w-full border-2 ${styles.border}`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              className="px-4 py-2"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              className={`px-4 py-2 ${styles.confirmButton}`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;