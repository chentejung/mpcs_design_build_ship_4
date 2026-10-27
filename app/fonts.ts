// Pulp's web fonts, self-hosted by next/font at build time. Inter catches Latin the display fonts lack; Noto Sans KR
// and Noto Serif TC catch Hangul and Han in original titles, and aren't preloaded.
import { Anton, Fugaz_One, Inter, Noto_Sans_KR, Noto_Serif_TC, Roboto_Condensed, Roboto_Slab } from "next/font/google";

const fugaz = Fugaz_One({ weight: "400", subsets: ["latin"], variable: "--font-fugaz" });
const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const robotoSlab = Roboto_Slab({ subsets: ["latin"], variable: "--font-roboto-slab" });
const robotoCondensed = Roboto_Condensed({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-roboto-condensed" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", preload: false });
const notoSansKr = Noto_Sans_KR({ weight: "700", subsets: ["latin"], variable: "--font-noto-sans-kr", preload: false });
const notoSerifTc = Noto_Serif_TC({ weight: "400", subsets: ["latin"], variable: "--font-noto-serif-tc", preload: false });

export const fontVariables = [fugaz, anton, robotoSlab, robotoCondensed, inter, notoSansKr, notoSerifTc].map((f) => f.variable).join(" ");
