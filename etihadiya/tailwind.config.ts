import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}"], theme: { extend: {
  colors: { palm: "#0E3B2C", dune: "#E9D8B0", gold: "#C99A2E", asphalt: "#16231E", paper: "#FBF8F0" },
  fontFamily: { display: ["var(--f-display)"], body: ["var(--f-body)"] } } }, plugins: [] } satisfies Config;
