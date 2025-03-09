import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Database, GitGraph, BarChart } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navigation: NavItem[] = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Database', href: '/database', icon: Database },
  { name: 'Path', href: '/path', icon: GitGraph },
  { name: 'Progress', href: '/progress', icon: BarChart },
];

export default function SidebarNavigation() {
  const pathname = usePathname();

  return (
    <nav className="px-2 pt-2 pb-4 space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href || 
                         (item.href !== '/' && pathname?.startsWith(item.href));
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              group flex items-center px-2 py-2 text-sm font-medium rounded-md 
              ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            <item.icon
              className={`
                mr-3 flex-shrink-0 h-5 w-5 
                ${isActive ? 'text-blue-600' : 'text-gray-500'}
              `}
              aria-hidden="true"
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
} 