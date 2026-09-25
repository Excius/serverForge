import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export function Modal({ isOpen, onClose, title, description, children, maxWidth = 'lg' }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    '3xl': 'max-w-6xl',
    '4xl': 'max-w-7xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={cn(
          'w-full glass-panel bg-zinc-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200',
          widthClasses[maxWidth]
        )}
      >
        <div className="px-7 py-6 border-b border-white/10 flex items-center justify-between bg-zinc-950/40">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
            {description && <p className="text-sm text-zinc-400 mt-1 leading-normal">{description}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 p-0 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-7 max-h-[85vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
