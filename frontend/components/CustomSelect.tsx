"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  id?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
  ariaLabel?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  className = "",
  disabled = false,
  searchable = false,
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
      setQuery("");
    };
    const closeOnScroll = () => {
      setIsOpen(false);
      setQuery("");
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  const openMenu = () => {
    if (disabled || options.length === 0) return;
    const trigger = containerRef.current?.getBoundingClientRect();
    if (!trigger) return;

    const estimatedHeight = Math.min((searchable ? 54 : 0) + filteredOptions.length * 42 + 10, 320);
    const spaceBelow = window.innerHeight - trigger.bottom;
    const top = spaceBelow < estimatedHeight && trigger.top > estimatedHeight
      ? trigger.top - estimatedHeight - 6
      : trigger.bottom + 6;
    const width = Math.min(Math.max(trigger.width, 180), window.innerWidth - 16);
    const left = Math.min(Math.max(8, trigger.left), Math.max(8, window.innerWidth - width - 8));

    setMenuPosition({ top, left, width });
    setIsOpen(true);
  };

  const choose = (option: Option) => {
    onChange(option.value);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        id={id}
        type="button"
        disabled={disabled || options.length === 0}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? (setIsOpen(false), setQuery("")) : openMenu())}
        className={[
          "group flex min-h-[46px] w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-semibold outline-none transition-all popover-trigger",
          "bg-white text-slate-700 border-slate-200 shadow-sm",
          "hover:border-slate-300 hover:shadow-md focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10",
          "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:border-slate-600",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-slate-200 disabled:hover:shadow-sm",
        ].join(" ")}
      >
        <span className={`min-w-0 truncate text-left ${selectedOption ? "text-slate-800 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-emerald-600" : "group-hover:text-slate-600"}`} />
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          className="popover-surface fixed z-[2300] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40"
          style={{ top: menuPosition.top, left: menuPosition.left, width: menuPosition.width }}
        >
          {searchable && options.length > 5 && (
            <div className="border-b border-slate-100 p-2.5 dark:border-slate-800">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search options..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          <div className="max-h-[260px] overflow-y-auto p-1.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs font-semibold text-slate-400">No matching options</div>
            ) : (
              filteredOptions.map((option) => {
                const selected = value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => choose(option)}
                    className={[
                      "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all",
                      selected
                        ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/60"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-50",
                    ].join(" ")}
                  >
                    <span className="truncate font-semibold">{option.label}</span>
                    {selected && <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
