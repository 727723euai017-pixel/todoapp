import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Todo App",
  description: "Simple todo app with role-based auth",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
