import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "QAdmin License Manager",
  description: "Secure license management dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en"><body>{children}</body></html>
  );
}
