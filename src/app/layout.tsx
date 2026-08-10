import type { Metadata, Viewport } from "next";
import {
  Anton,
  Space_Grotesk,
  Roboto,
  Oswald,
  Bebas_Neue,
  Playfair_Display,
  Montserrat,
  Lato,
  Merriweather,
  Poppins,
  Inter,
  Barlow_Condensed,
} from "next/font/google";
import "./globals.css";

const anton = Anton({ variable: "--font-display", subsets: ["latin"], weight: "400" });
const spaceGrotesk = Space_Grotesk({ variable: "--font-body", subsets: ["latin"] });
const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin"], weight: ["400", "700"] });
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"], weight: ["400", "700"] });
const bebasNeue = Bebas_Neue({ variable: "--font-bebas", subsets: ["latin"], weight: "400" });
const playfairDisplay = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["400", "700"] });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], weight: ["400", "700"] });
const lato = Lato({ variable: "--font-lato", subsets: ["latin"], weight: ["400", "700"] });
const merriweather = Merriweather({ variable: "--font-merriweather", subsets: ["latin"], weight: ["400", "700"] });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "700"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "700"] });
const barlowCondensed = Barlow_Condensed({ variable: "--font-barlow", subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "AYNIL — Conformity",
  description: "Générez une fiche de conformité de cadre à envoyer à la post-production.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

const fontVars = [
  anton.variable,
  spaceGrotesk.variable,
  roboto.variable,
  oswald.variable,
  bebasNeue.variable,
  playfairDisplay.variable,
  montserrat.variable,
  lato.variable,
  merriweather.variable,
  poppins.variable,
  inter.variable,
  barlowCondensed.variable,
].join(" ");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${fontVars} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
