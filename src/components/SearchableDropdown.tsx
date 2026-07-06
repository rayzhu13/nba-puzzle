"use client";

import { useEffect, useRef, useState } from "react";

export interface SearchOption {
  id: string;
  label: string;      // e.g. player name or team name
  sublabel?: string;   // e.g. team abbreviation for a player
  imageUrl?: string;
}

interface SearchableDropdownProps {
  kind: "team" | "player";
  placeholder?: string;
  disabled?: boolean;
  onSelect: (option: SearchOption) => void;
  /** Called after every selection so the parent can reset input if needed */
  clearOnSelect?: boolean;
}

/**
 * Type-ahead dropdown backed by /api/search. Used for both team-guessing
 * puzzles (types 1-3) and player-guessing grid puzzles (types 4-5) —
 * the `kind` prop is the only thing that changes.
 */
export default function SearchableDropdown({
  kind,
  placeholder,
  disabled,
  onSelect,
  clearOnSelect = true,
}: SearchableDropdownProps) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SearchOption[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 1) {
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?type=${kind}&q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data: SearchOption[] = await res.json();
        setOptions(data);
        setOpen(true);
        setHighlighted(0);
      } catch {
        // aborted — ignore
      }
    }, 180);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, kind]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function selectOption(option: SearchOption) {
    onSelect(option);
    setOpen(false);
    setQuery(clearOnSelect ? "" : option.label);
    setOptions([]);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || options.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectOption(options[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={query}
        disabled={disabled}
        placeholder={placeholder ?? (kind === "team" ? "Type a team name…" : "Type a player name…")}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);
          if (value.trim().length < 1) {
            setOptions([]);
            setOpen(false);
          }
        }}
        onKeyDown={onKeyDown}
        onFocus={() => options.length > 0 && setOpen(true)}
        className="w-full rounded-md border px-4 py-3 font-body text-base outline-none transition-colors disabled:opacity-40"
        style={{
          background: "var(--panel-raised)",
          borderColor: "var(--line)",
          color: "var(--court)",
        }}
      />
      {open && options.length > 0 && (
        <ul
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border shadow-lg"
          style={{ background: "var(--panel-raised)", borderColor: "var(--line)" }}
          role="listbox"
        >
          {options.map((opt, i) => (
            <li
              key={opt.id}
              role="option"
              aria-selected={i === highlighted}
              onMouseDown={() => selectOption(opt)}
              onMouseEnter={() => setHighlighted(i)}
              className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm"
              style={{
                background: i === highlighted ? "var(--panel)" : "transparent",
                color: "var(--court)",
              }}
            >
              {opt.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={opt.imageUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
              )}
              <span className="flex-1">{opt.label}</span>
              {opt.sublabel && (
                <span className="font-mono text-xs" style={{ color: "var(--court-dim)" }}>
                  {opt.sublabel}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
