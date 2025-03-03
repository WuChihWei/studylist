"use client";

import React from "react";
import { Sidebar } from "@/app/components/ui/sidebar";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {children}
    </div>
  );
} 