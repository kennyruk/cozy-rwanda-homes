import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronDown, MapPin } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

/*
 * Search-bar dropdowns that replace the browser's built-in <select> and <datalist> menus, which cannot be styled.
 * Built on a non-modal popover, so the page never locks or shifts while a menu is open.
 */

export type PickOption = { value: string; label: string; disabled?: boolean };
/** bare: the landing search bar. field: boxed like the form inputs. compact: small, for tables. */
export type PickVariant = "bare" | "field" | "compact";

const options = (list: HTMLElement | null) => [...(list?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];

/** A dropdown that behaves like a <select>: click or press Enter/Space/arrows to open, type a letter to jump. */
export function PickSelect({ value, onChange, items, ariaLabel, className, variant = "bare", disabled = false }: {
  value: string;
  onChange: (value: string) => void;
  items: PickOption[];
  ariaLabel: string;
  className?: string;
  variant?: PickVariant;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const selected = items.find((item) => item.value === value) ?? items[0];

  function choose(next: string) {
    if (items.find((item) => item.value === next)?.disabled) return;
    onChange(next);
    setOpen(false);
  }

  function onListKeyDown(event: React.KeyboardEvent) {
    const all = options(listRef.current).filter((el) => el.getAttribute("aria-disabled") !== "true");
    const current = all.indexOf(document.activeElement as HTMLElement);
    let target: HTMLElement | undefined;
    if (event.key === "ArrowDown") target = all[Math.min(current + 1, all.length - 1)];
    else if (event.key === "ArrowUp") target = all[Math.max(current - 1, 0)];
    else if (event.key === "Home") target = all[0];
    else if (event.key === "End") target = all[all.length - 1];
    else if (event.key === "Tab") { setOpen(false); return; }
    else if (event.key.length === 1 && /\S/.test(event.key) && !event.metaKey && !event.ctrlKey) {
      const letter = event.key.toLowerCase();
      target = [...all.slice(current + 1), ...all.slice(0, current + 1)].find((el) => el.textContent?.trim().toLowerCase().startsWith(letter));
    } else return;
    event.preventDefault();
    target?.focus();
  }

  return (
    <PopoverPrimitive.Root open={open && !disabled} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          role="combobox"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          data-empty={value === "" ? "true" : "false"}
          className={["pick-trigger", variant !== "bare" && `is-${variant}`, className].filter(Boolean).join(" ")}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); }
          }}
        >
          <span>{selected?.label}</span>
          <ChevronDown aria-hidden="true" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={`pick-menu pick-menu-${variant}`}
          side="bottom"
          align="start"
          sideOffset={variant === "bare" ? 10 : 6}
          collisionPadding={12}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            const all = options(listRef.current);
            (all.find((el) => el.getAttribute("aria-selected") === "true" && el.getAttribute("aria-disabled") !== "true") ?? all.find((el) => el.getAttribute("aria-disabled") !== "true"))?.focus();
          }}
        >
          <div ref={listRef} id={listId} role="listbox" aria-label={ariaLabel} className="pick-list" onKeyDown={onListKeyDown}>
            {items.map((item) => (
              <div
                key={item.value}
                role="option"
                tabIndex={-1}
                aria-selected={item.value === value}
                aria-disabled={item.disabled || undefined}
                className="pick-item"
                onClick={() => choose(item.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(item.value); }
                }}
              >
                <span>{item.label}</span>
                {item.value === value && <Check aria-hidden="true" />}
              </div>
            ))}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/** A text field that suggests places as you type. You can still type anything and search for it. */
export function LocationPick({ value, onChange, suggestions, placeholder, ariaLabel, withChevron = false }: {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  ariaLabel: string;
  withChevron?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const query = value.trim().toLowerCase();
    // Once a suggestion has been picked, show the full list again instead of a single match.
    if (!query || suggestions.some((place) => place.toLowerCase() === query)) return suggestions;
    return suggestions.filter((place) => place.toLowerCase().includes(query));
  }, [value, suggestions]);
  const visible = open && matches.length > 0;

  useEffect(() => setActive(-1), [value, open]);
  useEffect(() => {
    if (active >= 0) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, listId]);

  function choose(place: string) {
    onChange(place);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <PopoverPrimitive.Root open={visible} onOpenChange={setOpen}>
      <PopoverPrimitive.Anchor asChild>
        <div className="pick-field">
          <input
            ref={inputRef}
            value={value}
            placeholder={placeholder}
            aria-label={ariaLabel}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={visible}
            aria-controls={visible ? listId : undefined}
            aria-activedescendant={visible && active >= 0 ? `${listId}-${active}` : undefined}
            autoComplete="off"
            onChange={(event) => { onChange(event.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                if (!visible) setOpen(true);
                else setActive((index) => Math.min(index + 1, matches.length - 1));
              } else if (event.key === "ArrowUp" && visible) {
                event.preventDefault();
                setActive((index) => Math.max(index - 1, 0));
              } else if (event.key === "Enter" && visible && active >= 0) {
                event.preventDefault();
                choose(matches[active]!);
              } else if (event.key === "Escape" && visible) {
                event.stopPropagation();
                setOpen(false);
              }
            }}
          />
          {withChevron && <ChevronDown aria-hidden="true" />}
        </div>
      </PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="pick-menu"
          side="bottom"
          align="start"
          sideOffset={10}
          collisionPadding={12}
          // Keep typing in the field: don't move focus into the menu, and don't treat clicks on the field as "outside".
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => { if (inputRef.current?.contains(event.target as Node)) event.preventDefault(); }}
        >
          <div id={listId} role="listbox" aria-label={ariaLabel} className="pick-list">
            {matches.map((place, index) => (
              <div
                key={place}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                data-active={index === active ? "true" : "false"}
                className="pick-item"
                // mousedown would blur the field before the click lands, so keep focus where it is.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(place)}
              >
                <MapPin aria-hidden="true" />
                <span>{place}</span>
              </div>
            ))}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
