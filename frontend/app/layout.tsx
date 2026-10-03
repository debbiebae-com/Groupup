import type { Metadata } from "next";
import "./globals.css";
import { MSWProvider } from "@/components/MSWProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "GroupUp — Find your people, find your place",
  description: "A more human way for university students to find compatible roommates and form a home together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <MSWProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-150px)] pb-20 lg:pb-0">{children}</main>
          <Footer />
        </MSWProvider>
      </body>
    </html>
  );
}
