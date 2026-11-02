# Asset provenance

## Tamil Nadu demonstration photographs

The demo property images now use real Wikimedia Commons photographs, stored as optimized WebP files in `public/images/demo/`. Exact source URLs, authors and licences are retained in `public/images/demo/credits.json` and displayed publicly at `/photo-credits` (linked from the footer). Resizing/WebP conversion and display cropping are disclosed; CC BY-SA derivatives retain their respective licences. These are regional references only, not the offered properties. The residential-plot card uses an explicitly identified neighbourhood/open-ground reference, not a verified layout. The commercial demo has no photograph pending a suitable reference. The earlier Unsplash listing/interior imagery is no longer used by the seeded demo records or story sections.

- Current logo: `public/logo-hd.png`, copied byte-for-byte from the user-supplied `C:/Users/ROG/Downloads/SS Regalis Realty Emblem.png`. Used across public branding, admin screens and default social preview metadata. The earlier `logo-original.png` is retained as a previous asset.

## Kanchipuram homepage panorama

`public/images/kanchipuram-heritage.png` is original AI-generated artwork created with the built-in image generation tool for the user's requested landmark-inspired homepage redesign. `kanchipuram-heritage.webp` is its optimized website version (2172 × 724, approximately 310 KB). It is a stylized artistic interpretation, not a geographically accurate view or historical reconstruction. The user's Chennai reference supplied composition inspiration only; it was not copied into the website.

Prompt summary: Original premium panoramic architectural diorama of Kanchipuram-inspired Dravidian gopuram and Pallava temple architecture, a stepped temple tank, palms, greenery, understated modern villas, and flowing burgundy silk with gold borders. Warm ivory atmosphere and dawn lighting, antique-gold/sandstone/sage palette, complete towers, open space on the left for HTML copy. No text, logos, people, deities, sea, lighthouse, mountains or skyscrapers.

- `public/logo-original.png`: supplied by the user in this conversation, preserved unchanged. Original source filename: `codex-clipboard-79356ab4-1b74-4ba2-9f77-188ec7b5e0f7.png`.
- Architectural hero and demo house: Unsplash image `photo-1600596542815-ffad4c1539a9`.
- Story/about interior: Unsplash image `photo-1600210492486-724fe5c67fb0`.
- Other illustrative seed photographs: `photo-1500382017468-9049fed747ef`, `photo-1600607687920-4e2a09cf159d`, `photo-1472396961693-142e6e269027`, `photo-1600566753086-00f18fb6b3ea`, `photo-1486406146926-c627a92ad1ab`.
- Images are remotely served by `images.unsplash.com`, with resize/quality parameters. Review [Unsplash's license](https://unsplash.com/license) and replace demonstration stock photos with actual licensed property photographs before production publication. These images do not establish an association with the business or represent actual offered property.
- Gateway and conceptual buildings: original procedural geometry in `src/components/intro.tsx`. No temple reconstruction or real development claim is made.
- Interface icons: Lucide, ISC licensed through `lucide-react`.
- Typography: local system Georgia and Arial/Helvetica fallbacks; no remote font service.

## Current temple intro
The opening uses the user-supplied Camera_entering_temple_0b476793_1080p_gwr_video_mvp.mp4, copied unchanged to public/videos/temple-entrance.mp4 (1920x1080, 3.92 seconds, 6.9 MB). It plays muted and inline, using only the logo embedded in the video, followed directly by a 0.6-second homepage fade. The earlier image sequence is no longer loaded or rendered. The video fills every viewport using centered cover sizing, cropping the edges as needed to avoid blank bars. Browser storage key regalis-intro records completion or skipping. Reduced motion bypasses playback; playback errors, rejected autoplay, or a five-second loading/stall timeout dismiss the intro.

