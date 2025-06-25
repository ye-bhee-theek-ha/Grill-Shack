// src/app/admin/layout.tsx
"use client";

import React, { ReactNode, useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Header from "@/components/Header";
import useAuth from "@/hooks/useAuth";
import useUser from "@/hooks/useUser";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { profile, isLoading } = useUser();
  const router = useRouter();
  useEffect(() => {
    if (
      !isLoading &&
      profile?.role &&
      (!profile || !["admin", "staff"].includes(profile.role))
    ) {
      router.replace("/");
    }
  }, [profile, isLoading, router]);

  if (isLoading || !profile || !profile.role) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-black">
      <div className="relative w-20">
        <AdminSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
