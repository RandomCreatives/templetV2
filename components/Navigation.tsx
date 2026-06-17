'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/archive', label: 'ARCHIVE' },
  { href: '/projects', label: 'PROJECTS' },
  { href: '/about', label: 'ABOUT & CONTACT' }
];

export function Navigation() {
  const pathname = usePathname();

  if (pathname === '/register' || pathname === '/login') return null;

  return (
    <header className="sticky top-0 z-40 border-b border-black bg-white">
      <nav className="mx-auto flex max-w-[1800px] items-center justify-between px-3 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-black md:px-5">
        <div className="flex items-center gap-2">
          {links.map((link, index) => (
            <span key={link.href} className="flex items-center gap-2">
              <Link href={link.href} className="hover:text-gray-500">
                {link.label}
              </Link>
              {index < links.length - 1 ? <span aria-hidden="true">•</span> : null}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/register" className="hover:text-gray-500">
            REGISTER
          </Link>
          <span aria-hidden="true">•</span>
          <Link href="/login" className="hover:text-gray-500">
            LOGIN
          </Link>
        </div>
      </nav>
    </header>
  );
}
