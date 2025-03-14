"use client";

import React from "react";
import HomeNav from "@/app/components/HomeNav";

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <HomeNav />
      {children}
    </div>
  );
} 