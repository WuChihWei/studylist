import React from 'react';
import { Roboto } from 'next/font/google';
import './globals.css';
import ClientLayout from '../app/ClientLayout';

const roboto = Roboto({ subsets: ['latin'], weight: ['400', '500', '700'] });

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
      <body className={roboto.className} suppressHydrationWarning={true}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
