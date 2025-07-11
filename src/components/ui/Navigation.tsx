"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <header className="bg-blue-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="font-bold text-xl">
              PolishedDex
            </Link>
          </div>

          <nav className="flex space-x-4">
            <Link
              href="/pokemon"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/pokemon')
                  ? 'bg-blue-800 text-white'
                  : 'text-blue-100 hover:bg-blue-600'
              }`}
            >
              Pokémon
            </Link>

            <Link
              href="/locations"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/locations')
                  ? 'bg-blue-800 text-white'
                  : 'text-blue-100 hover:bg-blue-600'
              }`}
            >
              Locations
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
