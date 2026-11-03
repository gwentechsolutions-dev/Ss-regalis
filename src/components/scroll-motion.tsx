"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Content stays visible without JS. Only elements initially below the viewport
// animate as they enter; the hero and intro retain their existing behavior.
const targets = [
  ".section-heading",
  ".category-card",
  ".property-card",
  ".story-image",
  ".story-copy",
  ".values-grid > *",
  ".location-section > *",
  ".about-layout > *",
  ".contact-info > *",
  ".contact-form-card",
  ".detail-page section",
  ".detail-page details",
  ".contact-cta .container",
  ".footer-grid > *",
  ".legal-page > section",
].join(",");

export default function ScrollMotion() {
  const pathname = usePathname();
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    if (
      preference.matches ||
      !("IntersectionObserver" in window) ||
      !Element.prototype.animate
    )
      return;
    const seen = new WeakSet<Element>();
    const animations = new Map<Element, Animation>();
    let stopped = false;
    const finishAll = () => {
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          if (stopped || preference.matches) return;
          const element = entry.target as HTMLElement;
          const siblings = element.parentElement
            ? Array.from(element.parentElement.children).filter((el) =>
                el.matches(targets),
              )
            : [];
          const delay = Math.max(0, siblings.indexOf(element) % 3) * 65;
          const animation = element.animate(
            [
              { opacity: 0, translate: "0 16px" },
              { opacity: 1, translate: "0 0" },
            ],
            {
              duration: 600,
              delay,
              easing: "cubic-bezier(.22,1,.36,1)",
              fill: "backwards",
            },
          );
          animations.set(element, animation);
          void animation.finished
            .then(() => {
              if (animations.get(element) === animation)
                animations.delete(element);
            })
            .catch(() => {});
          const image = element.matches(".story-image")
            ? element.querySelector("img")
            : null;
          if (image) {
            const drift = image.animate([{ scale: 1.025 }, { scale: 1 }], {
              duration: 1100,
              easing: "cubic-bezier(.22,1,.36,1)",
            });
            animations.set(image, drift);
            void drift.finished
              .then(() => animations.delete(image))
              .catch(() => {});
          }
        });
      },
      { threshold: 0.06 },
    );
    const register = () => {
      if (stopped) return;
      document
        .querySelectorAll<HTMLElement>(
          `main ${targets
            .split(",")
            .map((s) => s.trim())
            .join(", main ")}, footer .footer-grid > *`,
        )
        .forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          // Never fade content already visible, focused, or hidden by an accordion.
          if (
            element.getBoundingClientRect().top < innerHeight - 12 ||
            !element.getClientRects().length
          )
            return;
          observer.observe(element);
        });
    };
    const mutations = new MutationObserver(register);
    const main = document.querySelector("main");
    if (main) mutations.observe(main, { childList: true, subtree: true });
    const reduce = () => {
      if (!preference.matches) return;
      stopped = true;
      observer.disconnect();
      mutations.disconnect();
      finishAll();
    };
    const focus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      animations.forEach((animation, element) => {
        if (element.contains(event.target as Node)) {
          animation.cancel();
          animations.delete(element);
        }
      });
    };
    register();
    preference.addEventListener("change", reduce);
    document.addEventListener("focusin", focus);
    return () => {
      stopped = true;
      observer.disconnect();
      mutations.disconnect();
      finishAll();
      preference.removeEventListener("change", reduce);
      document.removeEventListener("focusin", focus);
    };
  }, [pathname]);
  return null;
}

