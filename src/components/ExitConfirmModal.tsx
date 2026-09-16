import React, { useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { Language } from '../types';

interface ExitConfirmModalProps {
  isOpen: boolean;
  lang: Language;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  lang,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      id="exit-confirm-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-200"
      onClick={onCancel}
    >
      <div
        id="exit-confirm-modal"
        className="relative w-full max-w-sm rounded-2xl bg-[#14171f] border border-amber-500/30 p-6 shadow-2xl text-center transform transition-all duration-200 scale-100 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-inner">
          <LogOut className="h-7 w-7 text-amber-400" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
          {lang === 'kz' ? 'Дүкеннен шығу керек пе?' : 'Выйти из магазина?'}
        </h3>

        {/* Subtitle */}
        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          {lang === 'kz'
            ? 'Сайттан шығуды растайсыз ба, әлде тауарларды қарауды жалғастырасыз ба?'
            : 'Вы уверены, что хотите закрыть сайт и покинуть магазин?'}
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {/* Button "Нет" (stays on page) */}
          <button
            id="btn-exit-cancel"
            type="button"
            onClick={onCancel}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/30 active:scale-[0.98] transition-all cursor-pointer"
          >
            {lang === 'kz' ? 'Жоқ' : 'Нет'}
          </button>

          {/* Button "Да" (exits) */}
          <button
            id="btn-exit-confirm"
            type="button"
            onClick={onConfirm}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-500/30 active:scale-[0.98] transition-all cursor-pointer"
          >
            {lang === 'kz' ? 'Иә' : 'Да'}
          </button>
        </div>
      </div>
    </div>
  );
};
