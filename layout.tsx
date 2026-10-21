import "./globals.css";
import { Reem_Kufi, IBM_Plex_Sans_Arabic } from "next/font/google";
const display = Reem_Kufi({ subsets: ["arabic"], variable: "--f-display" });
const body = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "700"], variable: "--f-body" });
export const viewport = { themeColor: "#0E3B2C" };
export const metadata = { applicationName: "الإتحادية للنقل العمومي", appleWebApp: { capable: true, title: "الإتحادية", statusBarStyle: "default" as const }, title: "الإتحادية للنقل العمومي", description: "احجز مقعدك بين المدن الموريتانية" };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="ar" dir="rtl" className={`${display.variable} ${body.variable}`}><body>{children}</body></html>;
}
