import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
