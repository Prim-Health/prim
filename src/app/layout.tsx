'use client';

import RootLayout from './root-layout';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootLayout>{children}</RootLayout>;
}
