import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { UserSync } from '@/components/UserSync';
import NotificationContainer from '@/components/BeautifulNotification';

export const metadata: Metadata = {
  title: "AI-Powered Blog Platform",
  description: "Create and design amazing blogs with AI assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased">
          <UserSync />
          {children}
          <NotificationContainer />
        </body>
      </html>
    </ClerkProvider>
  );
}