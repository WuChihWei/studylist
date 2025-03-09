import React from 'react';
import Link from 'next/link';
import { Shield, HelpCircle } from 'lucide-react';

export default function SidebarFooter() {
  return (
    <div className="px-3 py-3 border-t border-gray-200">
      <div className="space-y-1">
        <Link
          href="/protection"
          className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
        >
          <Shield className="h-4 w-4 mr-2 text-gray-500" />
          Protection
        </Link>
        <Link
          href="/help"
          className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
        >
          <HelpCircle className="h-4 w-4 mr-2 text-gray-500" />
          Help
        </Link>
      </div>
    </div>
  );
} 