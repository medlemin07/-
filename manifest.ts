import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "الإتحادية للنقل العمومي", short_name: "الإتحادية", description: "احجز مقعدك بين المدن الموريتانية", start_url: "/", display: "standalone", lang: "ar",
    background_color: "#f6ead4", theme_color: "#0E3B2C",
    icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }] };
}
