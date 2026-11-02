import type { Metadata } from "next";
import "./globals.css";
import "./heritage.css";
import "./temple-intro.css";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "SS Regalis Reality | Properties across Tamil Nadu",
    template: "%s | SS Regalis Reality",
  },
  description:
    "Building Trust, Creating Value. Discover land, homes and new beginnings across Tamil Nadu. Based in Kanchipuram.",
  openGraph: { images: ["/logo-hd.png"] },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{if(location.pathname!=="/"||matchMedia("(prefers-reduced-motion: reduce)").matches)return;try{if(localStorage.getItem("regalis-intro")==="seen")return}catch{}document.documentElement.dataset.introPending="true";setTimeout(()=>{if(document.documentElement.dataset.introPending){delete document.documentElement.dataset.introPending;document.documentElement.dataset.introExpired="true"}},8000)})()`,
          }}
        />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
