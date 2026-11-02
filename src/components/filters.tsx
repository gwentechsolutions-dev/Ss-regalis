"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useTransition } from "react";
import { Search, SlidersHorizontal, X, Grid2X2, List } from "lucide-react";
import { categories, isHome } from "@/lib/domain";
export default function Filters({ total }: { total: number }) {
  const router = useRouter(),
    params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get("q") || "");
  const first = useRef(true);
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const current = params.toString();
  useEffect(() => {
    setQuery(params.get("q") || "");
  }, [current]);
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(current);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    startTransition(() =>
      router.push(`/properties?${next.toString()}`, { scroll: false }),
    );
  };
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (query === (params.get("q") || "")) return;
    const timer = setTimeout(() => update("q", query), 350);
    return () => clearTimeout(timer);
  }, [query, current]);
  const type = params.get("category") || "";
  const residential = !type || isHome(type);
  const active = [...params.entries()].filter(
    ([k, v]) => v && !["sort", "page", "view"].includes(k),
  );
  function apply() {
    const next = new URLSearchParams(current);
    const data = new FormData(form.current!);
    [
      "location",
      "minPrice",
      "maxPrice",
      "minArea",
      "maxArea",
      "unit",
      "bedrooms",
      "bathrooms",
      "facing",
      "construction",
      "furnishing",
      "status",
      "approvals",
      "parking",
      "water",
      "electricity",
      "road",
      "amenities",
      "featured",
    ].forEach((key) => {
      const val = String(data.get(key) || "");
      if (val) next.set(key, val);
      else next.delete(key);
    });
    next.delete("page");
    startTransition(() =>
      router.push(`/properties?${next}`, { scroll: false }),
    );
    dialog.current?.close();
  }
  return (
    <div className="directory-controls" aria-busy={pending}>
      <div className="category-tabs">
        <button
          disabled={pending}
          className={!type ? "active" : ""}
          onClick={() => update("category", "")}
        >
          All properties
        </button>
        {categories.map((c) => (
          <button
            key={c}
            disabled={pending}
            className={type === c ? "active" : ""}
            onClick={() => {
              const next = new URLSearchParams(current);
              next.set("category", c);
              next.delete("page");
              if (!isHome(c))
                ["bedrooms", "bathrooms", "furnishing", "construction"].forEach(
                  (k) => next.delete(k),
                );
              startTransition(() =>
                router.push(`/properties?${next}`, { scroll: false }),
              );
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="filter-bar">
        <div className="search-input">
          <Search size={18} />
          <input
            disabled={pending}
            aria-label="Search properties"
            placeholder="Search by property or location…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          className="button outline-button"
          onClick={() => dialog.current?.showModal()}
        >
          <SlidersHorizontal size={16} /> Filters
          {active.length > 0 && ` (${active.length})`}
        </button>
        <label className="sort-label">
          <span className="sr-only">Sort properties</span>
          <select
            value={params.get("sort") || "newest"}
            onChange={(e) => update("sort", e.target.value)}
          >
            {[
              ["newest", "Newest first"],
              ["oldest", "Oldest first"],
              ["price_asc", "Price: low to high"],
              ["price_desc", "Price: high to low"],
              ["area_asc", "Area: smallest first"],
              ["area_desc", "Area: largest first"],
              ...(residential ? [["bedrooms", "Bedrooms: most first"]] : []),
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="view-toggle">
          <button
            aria-label="Grid view"
            aria-pressed={params.get("view") !== "list"}
            onClick={() => update("view", "")}
          >
            <Grid2X2 size={18} />
          </button>
          <button
            aria-label="List view"
            aria-pressed={params.get("view") === "list"}
            onClick={() => update("view", "list")}
          >
            <List size={18} />
          </button>
        </div>
      </div>
      <div className="filter-summary">
        <p>
          {pending
            ? "Finding your space…"
            : `${total} ${total === 1 ? "property" : "properties"} to explore`}
        </p>
        {active.length > 0 && (
          <div className="filter-chips">
            {active.map(([k, v]) => (
              <button key={k} onClick={() => update(k, "")}>
                {k}: {v} <X size={12} />
              </button>
            ))}
            <button
              onClick={() => router.push("/properties", { scroll: false })}
            >
              Clear all
            </button>
          </div>
        )}
      </div>
      <dialog ref={dialog} className="filter-dialog">
        <div className="dialog-heading">
          <h2>Find your space</h2>
          <button
            aria-label="Close filters"
            onClick={() => dialog.current?.close()}
          >
            <X />
          </button>
        </div>
        <form
          ref={form}
          key={current}
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
        >
          <div className="form-grid">
            <label>
              Location
              <input
                name="location"
                defaultValue={params.get("location") || ""}
                placeholder="City, locality or village"
              />
            </label>
            <label>
              Availability
              <select name="status" defaultValue={params.get("status") || ""}>
                <option value="">All published statuses</option>
                {["Available", "Reserved", "Sold"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Minimum budget (₹)
              <input
                type="number"
                min="0"
                name="minPrice"
                defaultValue={params.get("minPrice") || ""}
              />
            </label>
            <label>
              Maximum budget (₹)
              <input
                type="number"
                min="0"
                name="maxPrice"
                defaultValue={params.get("maxPrice") || ""}
              />
            </label>
            <label>
              Minimum area
              <input
                type="number"
                min="0"
                name="minArea"
                defaultValue={params.get("minArea") || ""}
              />
            </label>
            <label>
              Maximum area
              <input
                type="number"
                min="0"
                name="maxArea"
                defaultValue={params.get("maxArea") || ""}
              />
            </label>
            <label>
              Area unit
              <select name="unit" defaultValue={params.get("unit") || "sq ft"}>
                {["sq ft", "cent", "acre", "sq m"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Facing
              <select name="facing" defaultValue={params.get("facing") || ""}>
                <option value="">Any direction</option>
                {[
                  "North",
                  "South",
                  "East",
                  "West",
                  "North-east",
                  "North-west",
                  "South-east",
                  "South-west",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            {residential && (
              <>
                <label>
                  Bedrooms (minimum)
                  <select
                    name="bedrooms"
                    defaultValue={params.get("bedrooms") || ""}
                  >
                    <option value="">Any</option>
                    {[1, 2, 3, 4, 5].map((x) => (
                      <option key={x} value={x}>
                        {x}+
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Bathrooms (minimum)
                  <select
                    name="bathrooms"
                    defaultValue={params.get("bathrooms") || ""}
                  >
                    <option value="">Any</option>
                    {[1, 2, 3, 4].map((x) => (
                      <option key={x} value={x}>
                        {x}+
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Construction
                  <select
                    name="construction"
                    defaultValue={params.get("construction") || ""}
                  >
                    <option value="">Any</option>
                    {["Ready to Move", "Under Construction", "Resale"].map(
                      (x) => (
                        <option key={x}>{x}</option>
                      ),
                    )}
                  </select>
                </label>
                <label>
                  Furnishing
                  <select
                    name="furnishing"
                    defaultValue={params.get("furnishing") || ""}
                  >
                    <option value="">Any</option>
                    {["Unfurnished", "Semi-furnished", "Furnished"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label>
              Verified approval
              <input
                name="approvals"
                placeholder="DTCP, CMDA, RERA…"
                defaultValue={params.get("approvals") || ""}
              />
            </label>
            <label>
              Road access
              <input
                name="road"
                defaultValue={params.get("road") || ""}
                placeholder="Road description"
              />
            </label>
            <label>
              Amenity
              <input
                name="amenities"
                defaultValue={params.get("amenities") || ""}
                placeholder="Garden, security…"
              />
            </label>
          </div>
          <div className="checkbox-grid">
            {[
              ["parking", "Parking"],
              ["water", "Water supply"],
              ["electricity", "Electricity"],
              ["featured", "Featured only"],
            ].map(([k, l]) => (
              <label key={k} className="check">
                <input
                  type="checkbox"
                  name={k}
                  value="true"
                  defaultChecked={params.get(k) === "true"}
                />
                {l}
              </label>
            ))}
          </div>
          <button className="button maroon-button">Show properties ↗</button>
        </form>
      </dialog>
    </div>
  );
}
