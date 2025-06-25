// src/app/admin/[[...slug]]/page.tsx

"use client";

import React, { useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import Link from "next/link";

// --- Icons for UI elements ---
const ArrowRightIcon = () => (
  <svg
    className="w-5 h-5 transition-transform duration-150 group-hover:translate-x-1"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 8l4 4m0 0l-4 4m4-4H3"
    />
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#B41219]"></div>
  </div>
);

const UnauthorizedMessage = () => (
  <div className="text-center p-10 text-xl text-red-500 bg-black min-h-screen flex items-center justify-center">
    <h1>Unauthorized Access</h1>
    <p>You do not have permission to view this page.</p>
  </div>
);

// --- The new Admin Homepage Component ---
const AdminHomePage: React.FC = () => {
  const { profile, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // This provides an additional layer of security, complementing the layout's check.
    if (
      !isLoading &&
      (!profile || !["admin", "staff"].includes(profile.role))
    ) {
      router.replace("/");
    }
  }, [profile, isLoading, router]);

  if (isLoading || !profile) {
    return <LoadingSpinner />;
  }

  if (!["admin", "staff"].includes(profile.role)) {
    return <UnauthorizedMessage />;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl sm:text-3xl text-white font-awakening">
        Admin Dashboard
      </h1>
      <p className="text-lg text-gray-400">
        Welcome, {profile.displayName || profile.email}. Select an option to
        manage your restaurant.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card Link to Orders */}
        <Link
          href="/admin/orders"
          className="group block p-6 bg-white/5 rounded-lg shadow-lg border border-primary-dark hover:border-primary hover:shadow-xl transition-all duration-200"
        >
          <h2 className="text-xl font-semibold text-white mb-2">
            Manage Orders
          </h2>
          <p className="text-gray-400 mb-4">View and update customer orders.</p>
          <div className="flex justify-end text-[#B41219]">
            <ArrowRightIcon />
          </div>
        </Link>

        {/* Card Link to Menu */}
        <Link
          href="/admin/menu"
          className="group block p-6 bg-white/5 rounded-lg shadow-lg border border-primary-dark hover:border-primary hover:shadow-xl transition-all duration-200"
        >
          <h2 className="text-xl font-semibold text-white mb-2">Manage Menu</h2>
          <p className="text-gray-400 mb-4">
            Add, edit, or remove menu items and categories.
          </p>
          <div className="flex justify-end text-[#B41219]">
            <ArrowRightIcon />
          </div>
        </Link>

        {/* Card Link to Site Content */}
        <Link
          href="/admin/site-content"
          className="group block p-6 bg-white/5 rounded-lg shadow-lg border border-primary-dark hover:border-primary hover:shadow-xl transition-all duration-200"
        >
          <h2 className="text-xl font-semibold text-white mb-2">
            Manage Site Content
          </h2>
          <p className="text-gray-400 mb-4">Update branding, info, and FAQs.</p>
          <div className="flex justify-end text-[#B41219]">
            <ArrowRightIcon />
          </div>
        </Link>
      </div>
    </div>
  );
};

// --- Main Page Export ---
export default function AdminCatchAllPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const slug = params.slug;

  // If there is no slug, it's the base /admin route, so we show the homepage.
  if (!slug || slug.length === 0) {
    return <AdminHomePage />;
  }

  // If a slug exists, it means the user navigated to a page that should be handled by its own `page.tsx`.
  // This component will not render because Next.js prioritizes more specific routes.
  // This return is a fallback for unhandled client-side navigations.
  return (
    <div>
      <h1 className="text-2xl text-white">Page Not Found</h1>
      <p className="text-gray-400">
        Please select a valid page from the sidebar.
      </p>
    </div>
  );
}
