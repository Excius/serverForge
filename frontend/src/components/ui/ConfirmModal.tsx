import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  description = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmText = 'Delete Permanently',
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'danger',
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-4">
        <div className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs font-medium leading-relaxed ${
          variant === 'warning'
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
            variant === 'warning' ? 'text-amber-400' : 'text-rose-400'
          }`} />
          <p>{description}</p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'warning' ? 'primary' : 'danger'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
