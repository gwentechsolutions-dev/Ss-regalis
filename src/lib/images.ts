/** Only transform our known stock-image CDN; preserve uploaded originals and other origins. */
export function responsiveSources(
  src: string,
  widths = [480, 800, 1200, 1800],
) {
  try {
    const url = new URL(src);
    if (url.hostname !== "images.unsplash.com") return undefined;
    return widths
      .map((width) => {
        const variant = new URL(url);
        variant.searchParams.set("w", String(width));
        variant.searchParams.set("auto", "format");
        return `${variant} ${width}w`;
      })
      .join(", ");
  } catch {
    return undefined;
  }
}
