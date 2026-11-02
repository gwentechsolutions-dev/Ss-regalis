"use client";
import Link from "next/link";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Property } from "@/lib/domain";
import { useReady } from "./use-ready";
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mobile-menu">
      <button
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <nav aria-label="Mobile navigation">
          {[
            ["/", "Home"],
            ["/properties", "Properties"],
            ["/about", "Our story"],
            ["/contact", "Contact"],
          ].map(([url, label]) => (
            <Link key={url} href={url} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
export function TrackedLink({
  kind,
  propertyId = "",
  href,
  children,
  className,
  label,
}: {
  kind: string;
  propertyId?: string;
  href: string;
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      target={kind === "whatsapp" ? "_blank" : undefined}
      rel="noreferrer"
      className={className}
      aria-label={label}
      onClick={() => {
        fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, propertyId }),
          keepalive: true,
        }).catch(() => {});
      }}
    >
      {children}
    </a>
  );
}
export function Gallery({ property: p }: { property: Property }) {
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "view", propertyId: p.id }),
    }).catch(() => {});
  }, [p.id]);
  if (!p.images.length)
    return (
      <div className="image-placeholder detail-placeholder">
        Property photography coming soon
      </div>
    );
  const prev = () => setIndex((index + p.images.length - 1) % p.images.length),
    next = () => setIndex((index + 1) % p.images.length);
  return (
    <div className="gallery">
      <button
        className="gallery-main"
        onClick={() => dialog.current?.showModal()}
        aria-label="Open fullscreen gallery"
      >
        <img src={p.images[index].url} alt={p.images[index].alt} />
        <span>
          View gallery · {index + 1} / {p.images.length}
        </span>
      </button>
      {p.images.length > 1 && (
        <div className="gallery-thumbs">
          {p.images.map((im, i) => (
            <button
              key={i}
              aria-label={`View image ${i + 1}`}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
            >
              <img src={im.url} alt={im.alt} />
            </button>
          ))}
        </div>
      )}
      <dialog
        ref={dialog}
        className="lightbox"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") next();
          if (e.key === "ArrowLeft") prev();
        }}
      >
        <button
          className="lightbox-close"
          aria-label="Close gallery"
          onClick={() => dialog.current?.close()}
        >
          <X />
        </button>
        <button aria-label="Previous image" onClick={prev}>
          <ChevronLeft />
        </button>
        <img src={p.images[index].url} alt={p.images[index].alt} />
        <button aria-label="Next image" onClick={next}>
          <ChevronRight />
        </button>
        <p>{p.images[index].alt}</p>
      </dialog>
    </div>
  );
}
export function EnquiryForm({ property }: { property?: Property }) {
  const ready = useReady();
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState(""),
    [success, setSuccess] = useState(false);
  return (
    <form
      method="post"
      className="enquiry-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setMessage("");
        const form = e.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        try {
          const r = await fetch("/api/enquiries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...data,
              consent: data.consent === "on",
              propertyId: property?.id || "",
            }),
          });
          const b = await r.json();
          if (!r.ok) throw new Error(b.error);
          setSuccess(true);
          setMessage(b.message);
          form.reset();
        } catch (e) {
          setSuccess(false);
          setMessage(
            e instanceof Error ? e.message : "Unable to send. Try again.",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <fieldset disabled={!ready} style={{ display: "contents" }}>
        <div className="form-grid">
          <label>
            Full name *
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
              placeholder="Your full name"
            />
          </label>
          <label>
            Mobile number *
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              pattern="\+?[0-9 ()\-]{8,20}"
              placeholder="Your mobile number"
            />
          </label>
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <label>
            Property interest *
            <select
              name="interest"
              defaultValue={property?.title || ""}
              required
            >
              <option value="" disabled>
                Select your interest
              </option>
              {property && <option>{property.title}</option>}
              {[
                "Residential Plot",
                "Farmland",
                "House",
                "Villa",
                "Apartment",
                "Commercial",
                "General enquiry",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Preferred location
            <input name="location" placeholder="An area you have in mind" />
          </label>
          <label>
            Preferred site visit date
            <input
              name="visitDate"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
            />
          </label>
        </div>
        <label>
          Your message *
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={3000}
            rows={4}
            placeholder="Tell us a little about what you’re looking for…"
            defaultValue={
              property
                ? `I would like to know more about ${property.title}.`
                : ""
            }
          />
        </label>
        <div className="honeypot" aria-hidden="true">
          <label>
            Leave this empty
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="check">
          <input name="consent" type="checkbox" required />{" "}
          <span>
            I agree to be contacted about this enquiry and have read the{" "}
            <Link href="/privacy-policy">privacy notice</Link>.
          </span>
        </label>
        <button className="button maroon-button" disabled={pending}>
          {pending ? "Sending…" : "Send enquiry"} <span>↗</span>
        </button>
        {message && (
          <p role="status" className={success ? "success" : "error-message"}>
            {message}
          </p>
        )}
        <small>
          A requested site visit is subject to confirmation by our team.
        </small>
      </fieldset>
    </form>
  );
}
