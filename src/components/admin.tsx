"use client";
import { SafeForm } from "./safe-form";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useReady } from "./use-ready";
import { ArrowUp, ArrowDown, Trash2, Upload, Plus, LogOut } from "lucide-react";
import {
  categories,
  isHome,
  propertySchema,
  type Property,
  type Settings,
} from "@/lib/domain";
async function api(url: string, body: unknown, method = "POST") {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const b = await r.json();
  if (!r.ok) throw new Error(b.error || "Request failed.");
  return b;
}
export function Logout() {
  return (
    <button
      className="logout"
      onClick={async () => {
        await api("/api/auth/logout", {});
        location.href = "/admin/login";
      }}
    >
      <LogOut size={16} /> Sign out
    </button>
  );
}
export function LoginForm({ resetToken }: { resetToken?: string }) {
  const ready = useReady();
  const [mode, setMode] = useState(resetToken ? "reset" : "login"),
    [message, setMessage] = useState(""),
    [pending, setPending] = useState(false);
  const router = useRouter();
  return (
    <SafeForm
      className="login-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setMessage("");
        const data = Object.fromEntries(new FormData(e.currentTarget));
        try {
          const b = await api(`/api/auth/${mode}`, {
            ...data,
            token: resetToken,
          });
          if (mode === "login") {
            window.location.assign("/admin");
          } else if (mode === "reset") {
            setMode("login");
            setMessage("Password updated. Sign in with your new password.");
          } else setMessage(b.message);
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setPending(false);
        }
      }}
    >
      <fieldset disabled={!ready} style={{ display: "contents" }}>
        <h1>
          {mode === "login"
            ? "Welcome back."
            : mode === "forgot"
              ? "Recover access."
              : "Set a new password."}
        </h1>
        <p>
          {mode === "login"
            ? "Sign in to manage your properties and enquiries."
            : "Use your registered administrator account."}
        </p>
        {mode !== "reset" && (
          <label>
            Email address
            <input name="email" type="email" autoComplete="username" required />
          </label>
        )}
        {mode !== "forgot" && (
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={
                mode === "reset" ? "new-password" : "current-password"
              }
              minLength={mode === "reset" ? 12 : 1}
              maxLength={200}
              required
            />
          </label>
        )}
        <button className="button maroon-button" disabled={pending}>
          {pending
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : mode === "forgot"
                ? "Send recovery link"
                : "Update password"}{" "}
          ↗
        </button>
        <button
          type="button"
          className="text-link"
          onClick={() => {
            setMode(mode === "login" ? "forgot" : "login");
            setMessage("");
          }}
        >
          {mode === "login" ? "Forgot your password?" : "Back to sign in"}
        </button>
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
      </fieldset>
    </SafeForm>
  );
}
export function PropertyEditor({ property }: { property?: Property }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const router = useRouter();
  const [category, setCategory] = useState(
    property?.category || "Residential Plot",
  );
  const [images, setImages] = useState(property?.images || []);
  const [floorPlans, setFloorPlans] = useState(property?.floorPlans || []);
  const [pending, setPending] = useState(false),
    [uploading, setUploading] = useState(false),
    [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const field = (
    key: string,
    label: string,
    type = "text",
    required = false,
  ) => (
    <label key={key}>
      {label}
      {required ? " *" : ""}
      <input
        name={key}
        type={type}
        required={required}
        step={type === "number" ? "any" : undefined}
        min={type === "number" ? "0" : undefined}
        defaultValue={String((property as any)?.[key] ?? "")}
      />
    </label>
  );
  const select = (key: string, label: string, options: string[]) => (
    <label key={key}>
      {label}
      <select name={key} defaultValue={String((property as any)?.[key] || "")}>
        <option value="">Not specified</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
  async function save(status?: string) {
    const form = formRef.current!;
    if (!form.reportValidity()) return;
    setPending(true);
    setMessage("");
    try {
      const data = Object.fromEntries(new FormData(form));
      const body: any = {
        ...data,
        category,
        images,
        floorPlans,
        version: property?.version,
      };
      for (const key of [
        "featured",
        "demo",
        "negotiable",
        "parking",
        "water",
        "electricity",
        "approvalVerified",
      ])
        body[key] = data[key] === "on";
      body.latitude = data.latitude ? Number(data.latitude) : null;
      body.longitude = data.longitude ? Number(data.longitude) : null;
      if (status) body.status = status;
      if (!isHome(category)) {
        body.bedrooms = 0;
        body.bathrooms = 0;
        body.builtUp = 0;
        body.furnishing = "";
        body.construction = "";
      }
      const parsed = propertySchema.safeParse(body);
      if (!parsed.success)
        throw new Error(
          parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        );
      await api(
        property
          ? `/api/admin/properties/${property.id}`
          : "/api/admin/properties",
        parsed.data,
        property ? "PUT" : "POST",
      );
      window.location.assign("/admin/properties");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <SafeForm
      ref={formRef}
      className="admin-form"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <section className="admin-panel">
        <h2>Property essentials</h2>
        <div className="form-grid">
          {field("title", "Property title", "text", true)}
          {field("slug", "URL slug (lowercase-with-hyphens)", "text", true)}
          <label>
            Category
            <select
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Availability
            <select name="status" defaultValue={property?.status || "Hidden"}>
              {["Hidden", "Available", "Reserved", "Sold"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          {field("price", "Total asking price (₹)", "number", true)}
          {field("area", "Land / property area", "number", true)}
          <label>
            Area unit
            <select name="unit" defaultValue={property?.unit || "sq ft"}>
              {["sq ft", "cent", "acre", "sq m"].map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </label>
          {field("location", "Locality / village", "text", true)}
          {field("city", "City")}
          {field("district", "District")}
          {field("address", "Public address (optional)")}
        </div>
        <label>
          Description *
          <textarea
            name="description"
            rows={6}
            minLength={20}
            maxLength={15000}
            required
            defaultValue={property?.description}
          />
        </label>
        <div className="checkbox-grid">
          {[
            ["featured", "Featured property"],
            ["demo", "Demonstration listing (not for sale)"],
            ["negotiable", "Price negotiable"],
          ].map(([k, l]) => (
            <label className="check" key={k}>
              <input
                type="checkbox"
                name={k}
                defaultChecked={!!(property as any)?.[k]}
              />
              {l}
            </label>
          ))}
        </div>
      </section>
      <section className="admin-panel">
        <h2>Photography</h2>
        <p>
          The first image is the cover. Upload JPEG, PNG or WebP files, up to 10
          MB each. Images are optimized and metadata removed.
        </p>
        <label className="upload-box">
          <Upload size={20} />
          {uploading ? "Optimizing images…" : "Upload property photographs"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading}
            onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              setUploading(true);
              setMessage("");
              try {
                for (const file of files) {
                  const body = new FormData();
                  body.set("file", file);
                  const r = await fetch("/api/admin/upload", {
                    method: "POST",
                    body,
                  });
                  const b = await r.json();
                  if (!r.ok) throw new Error(b.error);
                  setImages((current) => [
                    ...current,
                    {
                      url: b.url,
                      alt: file.name
                        .replace(/\.[^.]+$/, "")
                        .replaceAll("-", " "),
                    },
                  ]);
                }
              } catch (e) {
                setMessage((e as Error).message);
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
        <div className="image-manager">
          {images.map((image, i) => (
            <div key={`${image.url}-${i}`}>
              <img src={image.url} alt={image.alt} />
              <label>
                {i === 0 ? "Cover image description" : "Image description"}
                <input
                  value={image.alt}
                  required
                  minLength={3}
                  onChange={(e) =>
                    setImages(
                      images.map((im, n) =>
                        n === i ? { ...im, alt: e.target.value } : im,
                      ),
                    )
                  }
                />
              </label>
              <div>
                <button
                  type="button"
                  aria-label="Move image earlier"
                  disabled={i === 0}
                  onClick={() => {
                    const a = [...images];
                    [a[i - 1], a[i]] = [a[i], a[i - 1]];
                    setImages(a);
                  }}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Move image later"
                  disabled={i === images.length - 1}
                  onClick={() => {
                    const a = [...images];
                    [a[i + 1], a[i]] = [a[i], a[i + 1]];
                    setImages(a);
                  }}
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Remove image from listing"
                  onClick={() => setImages(images.filter((_, n) => n !== i))}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="admin-panel">
        <h2>Specifications & amenities</h2>
        <h3>{isHome(category) ? 'Floor plans & configurations' : 'Plot / land options'}</h3>
        <p>Add sizes and prices. Plan image links are optional.</p>
        {floorPlans.map((plan, i) => <div className="form-grid" key={i}>
          {(['type','area','price','url'] as const).map(key => <label key={key}>{({type:'Type / configuration',area:'Area (sq ft)',price:'Price (₹)',url:'Plan image URL'})[key]}<input required={key !== 'url'} type={key === 'area' || key === 'price' ? 'number' : 'text'} min={key === 'area' ? 0.01 : 0} step="any" value={plan[key]} onChange={e => setFloorPlans(floorPlans.map((p,n) => n === i ? {...p,[key]: key === 'area' || key === 'price' ? Number(e.target.value) : e.target.value} : p))} /></label>)}
          <button type="button" onClick={() => setFloorPlans(floorPlans.filter((_,n) => n !== i))}>Remove option</button>
        </div>)}
        <button type="button" disabled={floorPlans.length >= 40} onClick={() => setFloorPlans([...floorPlans,{type:category,area:0,price:0,url:''}])}>Add size / floor plan</button>
        <div className="form-grid">
          {isHome(category) && (
            <>
              {field("bedrooms", "Bedrooms", "number")}
              {field("bathrooms", "Bathrooms", "number")}
              {field("builtUp", "Built-up area (sq ft)", "number")}
              {select("furnishing", "Furnishing", [
                "Unfurnished",
                "Semi-furnished",
                "Furnished",
              ])}
              {select("construction", "Construction", [
                "Ready to Move",
                "Under Construction",
                "Resale",
              ])}
            </>
          )}
          {select("facing", "Facing", [
            "North",
            "South",
            "East",
            "West",
            "North-east",
            "North-west",
            "South-east",
            "South-west",
          ])}
          {field("road", "Road access")}
          <label>Amenities (one per line)<textarea name="amenities" maxLength={2000} rows={5} defaultValue={property?.amenities} placeholder={isHome(category) ? 'Landscaped garden\nGymnasium\nCovered parking\nSecurity' : 'Street lights\nInternal roads\nCompound wall\nAvenue trees'} /></label>
          <label>{category} specifications<textarea name="specifications" maxLength={10000} rows={6} defaultValue={property?.specifications} placeholder={isHome(category) ? 'Flooring, kitchen, ceiling height, ventilation, construction materials…' : 'Plot dimensions, road width, boundary, drainage, soil, water access…'} /></label>
          <label>Location advantages & nearby facilities<textarea name="advantages" maxLength={10000} rows={8} defaultValue={property?.advantages} placeholder={'Schools\nSchool name — 1.2 km\n\nHospitals\nHospital name — 3 km\n\nTransport\nRailway station — 2 km'} /></label>
          {field("landmarks", "Nearby landmarks")}
          {field("approvals", "Approval records / references")}
        </div>
        <div className="checkbox-grid">
          {[
            ["parking", "Parking available"],
            ["water", "Water available"],
            ["electricity", "Electricity available"],
            ["approvalVerified", "I have verified the approval documents"],
          ].map(([k, l]) => (
            <label className="check" key={k}>
              <input
                type="checkbox"
                name={k}
                defaultChecked={!!(property as any)?.[k]}
              />
              {l}
            </label>
          ))}
        </div>
      </section>
      <section className="admin-panel">
        <h2>Verified location</h2>
        <p>Leave coordinates empty unless the location has been verified.</p>
        <div className="form-grid">
          {field("mapsUrl", "Google Maps link", "url")}
          {field("latitude", "Latitude", "text")}
          {field("longitude", "Longitude", "text")}
        </div>
      </section>
      {message && (
        <p role="alert" className="error-message">
          {message}
        </p>
      )}
      <div className="editor-actions">
        <button
          className="button maroon-button"
          disabled={!ready || pending || uploading}
        >
          {pending ? "Saving…" : "Save property"}
        </button>
        <button
          type="button"
          className="button outline-button"
          disabled={!ready || pending || uploading}
          onClick={() => save("Hidden")}
        >
          Save as draft
        </button>
        <Link href="/admin/properties">Cancel</Link>
      </div>
    </SafeForm>
  );
}
export function BulkActions({
  properties,
  archived = false,
}: {
  properties: Property[];
  archived?: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]),
    [message, setMessage] = useState(""),
    [pending, setPending] = useState(false);
  async function act(action: string, ids = selected) {
    if (!ids.length) return;
    if (
      action === "archive" &&
      !confirm(
        `Archive ${ids.length} listing(s)? They will be removed from the public website and can be restored.`,
      )
    )
      return;
    setPending(true);
    try {
      await api("/api/admin/properties/bulk", { ids, action });
      setSelected([]);
      router.refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <div className="bulk-bar">
        <span>{selected.length} selected</span>
        {(archived
          ? ["restore"]
          : ["Available", "Reserved", "Sold", "Hidden", "archive"]
        ).map((action) => (
          <button
            key={action}
            disabled={!selected.length || pending}
            onClick={() => act(action)}
          >
            {action === "Available"
              ? "Publish"
              : action === "Hidden"
                ? "Hide"
                : action === "archive"
                  ? "Archive"
                  : action === "restore"
                    ? "Restore"
                    : `Mark ${action.toLowerCase()}`}
          </button>
        ))}
      </div>
      {message && <p role="alert">{message}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Select all properties on this page"
                  checked={
                    !!properties.length && selected.length === properties.length
                  }
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? properties.map((p) => p.id) : [],
                    )
                  }
                />
              </th>
              <th>Property</th>
              <th>Location</th>
              <th>Price</th>
              <th>Status</th>
              <th>Listed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${p.title}`}
                    checked={selected.includes(p.id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, p.id]
                          : selected.filter((id) => id !== p.id),
                      )
                    }
                  />
                </td>
                <td>
                  <div className="table-property">
                    {p.images[0] && <img src={p.images[0].url} alt="" />}
                    <span>
                      <Link href={`/admin/properties/${p.id}/edit`}>
                        {p.title}
                      </Link>
                      <small>
                        {p.category}
                        {p.demo ? " · DEMO" : ""}
                      </small>
                    </span>
                  </div>
                </td>
                <td>{p.location}</td>
                <td>₹{p.price.toLocaleString("en-IN")}</td>
                <td>
                  <span className={`status status-${p.status.toLowerCase()}`}>
                    {p.status}
                  </span>
                </td>
                <td>{new Date(p.createdAt).toLocaleDateString("en-IN")}</td>
                <td>
                  <div className="table-actions">
                    <Link href={`/admin/properties/${p.id}/edit`}>Edit</Link>
                    {p.status !== "Hidden" && !archived && (
                      <Link href={`/properties/${p.slug}`}>View</Link>
                    )}
                    {!archived && p.status !== "Sold" && (
                      <button
                        disabled={pending}
                        onClick={() => act("Sold", [p.id])}
                      >
                        Mark sold
                      </button>
                    )}
                    <button
                      disabled={pending}
                      onClick={() =>
                        act(archived ? "restore" : "archive", [p.id])
                      }
                    >
                      {archived ? "Restore" : "Archive"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
export function SettingsEditor({ settings: s }: { settings: Settings }) {
  const router = useRouter();
  const [message, setMessage] = useState(""),
    [pending, setPending] = useState(false),
    [logo, setLogo] = useState(s.logo);
  return (
    <SafeForm
      className="admin-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setMessage("");
        const data = Object.fromEntries(new FormData(e.currentTarget));
        try {
          await api(
            "/api/admin/settings",
            { ...data, logo, showSold: data.showSold === "on" },
            "PUT",
          );
          setMessage(
            "Business settings saved. Public pages now use these details.",
          );
          router.refresh();
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="notice">
        Brand confirmation: the original logo reads “SS REGALIS REALTY”; the
        written brief uses “SS Regalis Reality”. Set the confirmed display name
        below. The original artwork is retained.
      </div>
      {[
        ["Brand & company", ["name", "tagline", "description", "about"]],
        [
          "Contact details",
          ["phone", "whatsapp", "email", "address", "hours", "mapsUrl"],
        ],
        ["Social profiles", ["instagram", "facebook", "twitter", "youtube"]],
        [
          "Search & messaging",
          ["seoTitle", "seoDescription", "whatsappMessage"],
        ],
        ["Approved 3D asset", ["templeModel"]],
      ].map(([title, keys]) => (
        <section className="admin-panel" key={title as string}>
          <h2>{title as string}</h2>
          <div className="form-grid">
            {(keys as (keyof Settings)[]).map((key) => (
              <label key={key}>
                {(
                  {
                    name: "Business display name",
                    tagline: "Tagline",
                    phone: "Phone (international format)",
                    whatsapp: "WhatsApp (country code + digits, no +)",
                    mapsUrl: "Verified office Google Maps link",
                    templeModel: "Approved licensed GLB model URL (optional)",
                    whatsappMessage: "Default WhatsApp message; use {business}",
                    seoTitle: "SEO title",
                    seoDescription: "SEO description",
                  } as Record<string, string>
                )[key] || key.charAt(0).toUpperCase() + key.slice(1)}
                {[
                  "description",
                  "about",
                  "address",
                  "whatsappMessage",
                  "seoDescription",
                ].includes(key) ? (
                  <textarea name={key} rows={3} defaultValue={String(s[key])} />
                ) : (
                  <input
                    name={key}
                    defaultValue={String(s[key])}
                    required={key === "name"}
                    type={key === "email" ? "email" : "text"}
                  />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}
      <section className="admin-panel">
        <h2>Original logo</h2>
        <img
          className="settings-logo"
          src={logo || "/logo-hd.png"}
          alt="Current brand logo"
        />
        <label>
          Replace logo
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setPending(true);
              try {
                const form = new FormData();
                form.set("file", file);
                const r = await fetch("/api/admin/upload", {
                  method: "POST",
                  body: form,
                });
                const b = await r.json();
                if (!r.ok) throw new Error(b.error);
                setLogo(b.url);
              } catch (e) {
                setMessage((e as Error).message);
              } finally {
                setPending(false);
              }
            }}
          />
        </label>
        <button type="button" className="text-link" onClick={() => setLogo("")}>
          Use supplied original logo
        </button>
        <label className="check">
          <input type="checkbox" name="showSold" defaultChecked={s.showSold} />
          Show sold properties in the public directory
        </label>
      </section>
      <button className="button maroon-button" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </button>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
    </SafeForm>
  );
}
export function EnquiryEditor({ enquiry: e }: { enquiry: any }) {
  const router = useRouter();
  const [message, setMessage] = useState(""),
    [pending, setPending] = useState(false);
  return (
    <details className="enquiry-item">
      <summary>
        <span>
          <strong>{e.name}</strong>
          <small>
            {e.interest} · {new Date(e.createdAt).toLocaleDateString("en-IN")}
          </small>
        </span>
        <span className="status">{e.status}</span>
      </summary>
      <div className="enquiry-body">
        <p>
          <a href={`tel:${e.phone}`}>{e.phone}</a>
          {e.email && (
            <>
              {" "}
              · <a href={`mailto:${e.email}`}>{e.email}</a>
            </>
          )}
        </p>
        <p className="preserve-lines">{e.message}</p>
        {e.location && <p>Preferred location: {e.location}</p>}
        {e.visitDate && <p>Requested visit: {e.visitDate} — not confirmed</p>}
        <SafeForm
          onSubmit={async (event) => {
            event.preventDefault();
            setPending(true);
            try {
              await api(
                `/api/admin/enquiries/${e.id}`,
                Object.fromEntries(new FormData(event.currentTarget)),
                "PUT",
              );
              setMessage("Enquiry updated.");
              router.refresh();
            } catch (err) {
              setMessage((err as Error).message);
            } finally {
              setPending(false);
            }
          }}
        >
          <label>
            Status
            <select name="status" defaultValue={e.status}>
              {["New", "Contacted", "Follow-up", "Closed"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Private notes
            <textarea name="notes" rows={3} defaultValue={e.notes} />
          </label>
          <button className="button maroon-button" disabled={pending}>
            Save enquiry
          </button>
          {message && <p role="status">{message}</p>}
        </SafeForm>
      </div>
    </details>
  );
}
export function RetentionControl() {
  const [message, setMessage] = useState("");
  return (
    <SafeForm
      className="admin-panel"
      onSubmit={async (e) => {
        e.preventDefault();
        const before = String(new FormData(e.currentTarget).get("before"));
        if (
          !confirm(
            `Permanently delete closed enquiries older than ${before}? This cannot be undone.`,
          )
        )
          return;
        try {
          const b = await api("/api/admin/enquiries/purge", { before });
          setMessage(b.message);
        } catch (e) {
          setMessage((e as Error).message);
        }
      }}
    >
      <h2>Data retention</h2>
      <p>
        Delete only closed enquiries older than the selected date. At least 30
        days must be retained.
      </p>
      <label>
        Delete closed enquiries before
        <input
          type="date"
          name="before"
          required
          max={new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)}
        />
      </label>
      <button className="button outline-button">Review and delete</button>
      {message && <p role="status">{message}</p>}
    </SafeForm>
  );
}

