import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Porto Market Heatmap",
  description: "A live heatmap for US, Indonesian, and crypto markets.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
