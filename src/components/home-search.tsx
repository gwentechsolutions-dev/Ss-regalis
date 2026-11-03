"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Check, MapPin } from "lucide-react";
type Option = { value: string; label: string };
function SearchChoice({
  id,
  name,
  label,
  options,
  editable = false,
}: {
  id: string;
  name: string;
  label: string;
  options: Option[];
  editable?: boolean;
}) {
  const [ready, setReady] = useState(false),
    [value, setValue] = useState(""),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(-1);
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  const filtered = editable
    ? options
        .filter((o) =>
          o.label.toLowerCase().includes(value.trim().toLowerCase()),
        )
        .slice(0, 8)
    : options;
  const choose = (o: Option) => {
    setValue(o.value);
    setOpen(false);
    setActive(-1);
  };
  return (
    <div
      className="search-choice"
      ref={root}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setOpen(false);
          setActive(-1);
        }
      }}
    >
      <label htmlFor={id}>{label}</label>
      {!ready ? (
        editable ? (
          <input id={id} name={name} placeholder="City, town or locality" />
        ) : (
          <select id={id} name={name}>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )
      ) : (
        <>
          {!editable && <input type="hidden" name={name} value={value} />}
          <div className="search-choice-control">
            <input
              id={id}
              name={editable ? name : undefined}
              role="combobox"
              aria-autocomplete={editable ? "list" : "none"}
              aria-expanded={open}
              aria-controls={listId}
              aria-activedescendant={
                open && active >= 0 ? `${listId}-${active}` : undefined
              }
              autoComplete="off"
              readOnly={!editable}
              placeholder={editable ? "City, town or locality" : undefined}
              value={
                editable
                  ? value
                  : options.find((o) => o.value === value)?.label || ""
              }
              onFocus={() => {
                if (editable) setOpen(true);
              }}
              onClick={() => {
                setOpen(true);
                setActive(-1);
              }}
              onChange={(e) => {
                setValue(e.target.value);
                setOpen(true);
                setActive(-1);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  if (open) e.preventDefault();
                  setOpen(false);
                  setActive(-1);
                }
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  setOpen(true);
                  setActive((n) =>
                    e.key === "ArrowDown"
                      ? Math.min(n + 1, filtered.length - 1)
                      : Math.max(0, n - 1),
                  );
                }
                if (
                  e.key === "Enter" &&
                  open &&
                  active >= 0 &&
                  filtered[active]
                ) {
                  e.preventDefault();
                  choose(filtered[active]);
                }
                if (!editable && e.key === " ") {
                  e.preventDefault();
                  setOpen((v) => !v);
                }
                if (e.key === "Tab") setOpen(false);
              }}
            />
            {editable ? (
              <MapPin size={16} aria-hidden="true" />
            ) : (
              <ChevronDown
                size={16}
                aria-hidden="true"
                className={open ? "is-open" : ""}
              />
            )}
          </div>
          {open && (
            <div className="search-choice-popover">
              <p>
                {editable
                  ? "LOCATIONS IN TAMIL NADU"
                  : name === "category"
                    ? "PROPERTY TYPE"
                    : "PRICE RANGE"}
              </p>
              <ul id={listId} role="listbox" aria-label={label}>
                {filtered.map((o, i) => (
                  <li
                    key={o.value}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={value === o.value}
                    className={active === i ? "is-active" : ""}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => choose(o)}
                    onPointerMove={() => setActive(i)}
                  >
                    <span>{o.label}</span>
                    {value === o.value && (
                      <Check size={15} aria-hidden="true" />
                    )}
                  </li>
                ))}
              </ul>
              {!filtered.length && (
                <div className="search-choice-empty">
                  No suggestions. You can search this location as typed.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
export default function HomeSearch({
  locations = [],
}: {
  locations?: string[];
}) {
  const towns = Array.from(
    new Set([
      ...locations,
      "Chennai",
      "Kanchipuram",
      "Chengalpattu",
      "Oragadam",
      "Sriperumbudur",
      "Tambaram",
      "OMR, Chennai",
      "Coimbatore",
      "Madurai",
      "Tirunelveli",
      "Tiruchirappalli",
      "Salem",
      "Erode",
      "Hosur",
      "Vellore",
      "Thanjavur",
      "Tiruppur",
      "Uthiramerur",
      "Nagercoil",
      "Thoothukudi",
      "Cuddalore",
      "Villupuram",
    ]),
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  return (
    <form action="/properties" className="home-search">
      <SearchChoice
        id="home-type"
        name="category"
        label="I’M LOOKING FOR"
        options={[
          { value: "", label: "All property types" },
          ...[
            "Residential Plot",
            "Farmland",
            "House",
            "Villa",
            "Apartment",
            "Commercial",
          ].map((value) => ({ value, label: value })),
        ]}
      />
      <SearchChoice
        id="home-location"
        name="location"
        label="IN AND AROUND"
        editable
        options={towns.map((value) => ({ value, label: value }))}
      />
      <SearchChoice
        id="home-budget"
        name="maxPrice"
        label="MY BUDGET"
        options={[
          { value: "", label: "Any budget" },
          { value: "2500000", label: "Up to ₹25 Lac" },
          { value: "5000000", label: "Up to ₹50 Lac" },
          { value: "10000000", label: "Up to ₹1 Cr" },
          { value: "20000000", label: "Up to ₹2 Cr" },
        ]}
      />
      <button className="button maroon-button">
        Find my property <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
