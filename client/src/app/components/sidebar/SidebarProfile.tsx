import React from 'react';
import Link from 'next/link';
import { User } from '@/types/User';
import { UserCircle } from 'lucide-react';

interface SidebarProfileProps {
  user: User | null;
  contributionMins: number;
}

export default function SidebarProfile({ user, contributionMins }: SidebarProfileProps) {
  return (
    <Link 
      href="/profile" 
      className="block px-3 py-3 mx-3 my-1 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {user?.photoURL ? (
            <img
              className="h-10 w-10 rounded-full"
              src={user.photoURL}
              alt={user.name || 'User'}
            />
          ) : (
            <UserCircle className="h-10 w-10 text-gray-400" />
          )}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user?.name || 'User'}
          </p>
          <p className="text-xs text-gray-500">
            <span className="font-semibold">{contributionMins}</span> contribution mins
          </p>
        </div>
      </div>
    </Link>
  );
} 