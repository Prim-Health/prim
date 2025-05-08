'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/layout/Sidebar";

export function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login';

  return (
    <div className="flex h-screen">
      {!isAuthPage && <Sidebar />}
      <main className={`${!isAuthPage ? 'flex-1' : 'w-full'} overflow-y-auto bg-gray-50`}>
        {children}
      </main>
    </div>
  );
} 