import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Network Engineer Cloud Academy",
  description: "Bilingual Google Cloud network engineering training path with lessons and quizzes."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
