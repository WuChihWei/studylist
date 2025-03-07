"use client";

import React, { useEffect, useState } from "react";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 不再处理侧边栏状态，保留基本布局容器
  return (
    <div className="flex h-screen w-full">
      {children}
    </div>
  );
} 