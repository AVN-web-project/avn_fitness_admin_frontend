import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Multi-select dropdown with checkboxes, used by the product Media tab to scope an image to
 * several variants at once. The native <select> it replaces could only hold one value, which is
 * why an image could never be shared across variants.
 *
 * Options are shown by SKU only — that is the key the image stores and the PDP matches on, so a
 * friendly size/colour label alongside it only invited confusion when the two disagreed.
 *
 * Props
 *   label      - shown above the trigger
 *   options    - [{ value, label }]
 *   selected   - array of selected values
 *   onToggle   - (value, checked) => void
 *   emptyLabel - text when nothing is selected
 *   disabled   - greys the control out
 */
export default function VariantCheckboxDropdown({
  label,
  options = [],
  selected = [],
  onToggle,
  emptyLabel = 'All Variants',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selectedSet = new Set(selected.map((s) => String(s).toUpperCase()));
  const count = options.filter((o) => selectedSet.has(String(o.value).toUpperCase())).length;
  const summary =
    count === 0
      ? emptyLabel
      : count === 1
        ? (options.find((o) => selectedSet.has(String(o.value).toUpperCase()))?.label ?? '1 selected')
        : `${count} selected`;

  return (
    <div className="relative" ref={wrapRef}>
      {label && (
        <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-0.5">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled || options.length === 0}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg border text-xs text-left transition-colors ${
          disabled || options.length === 0
            ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-400 cursor-pointer'
        }`}
      >
        <span className={`truncate ${count === 1 ? 'font-mono text-[11px]' : ''}`}>{summary}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && options.length > 0 && (
        <div
          role="listbox"
          className="absolute z-30 mt-1 w-full min-w-[190px] max-h-52 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-1"
        >
          {options.map((opt) => {
            const isOn = selectedSet.has(String(opt.value).toUpperCase());
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isOn}
                onClick={() => onToggle && onToggle(opt.value, !isOn)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span
                  className={`w-3.5 h-3.5 shrink-0 rounded border flex items-center justify-center ${
                    isOn ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {isOn && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </span>
                <span className="truncate font-mono text-[11px]">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
