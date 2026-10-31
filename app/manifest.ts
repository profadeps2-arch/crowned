import type { MetadataRoute } from "next";

// Lets him add Crowned to his home screen so it opens like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Crowned",
    short_name: "Crowned",
    description: "Every man is a king. Dress like one.",
    start_url: "/today",
    display: "standalone",
    background_color: "#0D1723",
    theme_color: "#FDFAF6",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
