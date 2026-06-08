import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Rede Ninhada — Hub de Acolhimento Animal",
  description: "Conectamos animais, protetores, organizações e pessoas que desejam ajudar, fortalecendo a rede de acolhimento animal de São Luís e região.",
  metadataBase: new URL("https://redeninhada.com.br"), // Placeholder para og:image funcionar
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={outfit.variable}>
      <body>{children}</body>
    </html>
  );
}
