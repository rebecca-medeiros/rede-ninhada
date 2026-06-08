import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Rede Ninhada — Hub de Acolhimento Animal",
  description: "Conectamos animais, ONGs, protetores, voluntários e pessoas que desejam ajudar, fortalecendo a rede de acolhimento animal do Maranhão.",
  metadataBase: new URL("https://redeninhada.com.br"), // Placeholder para og:image funcionar
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={nunito.variable}>
      <body>{children}</body>
    </html>
  );
}
