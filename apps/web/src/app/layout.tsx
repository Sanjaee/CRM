import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WahanaTravel - CRM & Invoice Management",
  description: "Enterprise CRM, Invoices, Payments, Department, and RBAC Management System for PT Wahana Mazmur Wisata",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.className} h-full bg-background text-foreground antialiased`}>
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
