import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "TVStream - Xem truyền hình IPTV",
  description: "Nền tảng xem tivi trực tuyến cao cấp với hơn 200 kênh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh flex flex-col bg-background text-foreground font-sans">
        <Providers>
          <Navbar />
          <main className="flex-1 pt-14">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
