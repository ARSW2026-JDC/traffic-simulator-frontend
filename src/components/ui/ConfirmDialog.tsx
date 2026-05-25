interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1700] flex items-center justify-center bg-black/40" role="presentation" onClick={onCancel}>
      <div className="bg-white dark:bg-[#1f2937] rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6 text-sm" role="none" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-[var(--s-text)] mb-2">{title}</h3>
        <p className="text-[var(--s-sub)] mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-medium text-[var(--s-sub)] bg-[var(--s-gray)] hover:bg-[var(--s-border)] rounded-lg transition-colors" type="button">{cancelLabel}</button>
          <button onClick={onConfirm} className="px-4 py-2 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors" type="button">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
