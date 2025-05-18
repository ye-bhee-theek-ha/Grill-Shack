// src/components/admin/AdminSidebar.tsx

"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// --- SVG Icon Components ---
interface SvgIconProps {
    className?: string;
}

const ScrollTextIcon: React.FC<SvgIconProps> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"/>
        <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1"/>
        <path d="M12 3v18"/>
    </svg>
);

const LayoutDashboardIcon: React.FC<SvgIconProps> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="7" height="9" x="3" y="3" rx="1"/>
        <rect width="7" height="5" x="14" y="3" rx="1"/>
        <rect width="7" height="9" x="14" y="12" rx="1"/>
        <rect width="7" height="5" x="3" y="16" rx="1"/>
    </svg>
);

const UtensilsIcon: React.FC<SvgIconProps> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
        <path d="M7 2v20"/>
        <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"/>
    </svg>
);

const BarChart3Icon: React.FC<SvgIconProps> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 3v18h18"/>
        <path d="M18 17V9"/>
        <path d="M13 17V5"/>
        <path d="M8 17v-3"/>
    </svg>
);

const SettingsIcon: React.FC<SvgIconProps> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 .54 1.73L5 8l-.46 1.73A2 2 0 0 1 4 11.4l-.25.43a2 2 0 0 1 0 2l.25.43A2 2 0 0 1 5 15.73L5 16l-.03.18a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-.54-1.73L19 16l.46-1.73A2 2 0 0 1 20 12.6l.25-.43a2 2 0 0 1 0-2l-.25-.43A2 2 0 0 1 19 8.27L19 8l.03-.18a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const ShieldCheckIcon: React.FC<SvgIconProps> = ({ className = "w-7 h-7" }) => ( // Default to larger size for logo
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4"/>
    </svg>
);


// Define navigation items with SVG components
const navItems = [
    { name: 'Orders', href: '/admin/orders', icon: ScrollTextIcon },
    { name: 'Site Content', href: '/admin/site-content', icon: LayoutDashboardIcon },
    { name: 'Menu Items', href: '/admin/menu', icon: UtensilsIcon },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3Icon },
    // { name: 'Settings', href: '/admin/settings', icon: SettingsIcon }, // Example
];

const AdminSidebar: React.FC = () => {
    const pathname = usePathname();
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <aside
            className={`fixed top-0 left-0 h-screen z-50 bg-neutral-900 border-r border-neutral-800/50 flex flex-col transition-all duration-300 ease-in-out shadow-lg
                        ${isExpanded ? 'w-60' : 'w-20'}`}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* Logo or Title Area */}
            <div className="h-20 flex items-center justify-center border-b border-neutral-800/50 flex-shrink-0 overflow-hidden">
                <Link href="/admin" className="flex items-center justify-center w-full h-full">
                    {isExpanded ? (
                        <span className={`text-xl font-bold text-[#B41219] transition-all duration-200 ease-in-out delay-100 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                            Admin Panel
                        </span>
                    ) : (
                        <ShieldCheckIcon className="w-7 h-7 text-[#B41219] transition-all duration-200 ease-in-out" />
                    )}
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const IconComponent = item.icon; // Alias for clarity
                    return (
                        <Link key={item.name} href={item.href} legacyBehavior>
                            <a
                                title={isExpanded ? '' : item.name} // Show tooltip when collapsed
                                className={`flex items-center h-12 text-sm font-medium rounded-lg transition-all duration-150 ease-in-out group relative
                                            ${isExpanded ? 'px-3 py-2.5' : 'justify-center'}
                                            ${isActive
                                                ? 'bg-[#B41219]/90 text-white shadow-md'
                                                : 'text-neutral-400 hover:bg-neutral-700/60 hover:text-neutral-100'
                                            }`}
                            >
                                <IconComponent className={`w-5 h-5 flex-shrink-0 transition-colors duration-150 ${isActive ? 'text-white' : 'group-hover:text-neutral-100'}`} />
                                <span
                                    className={`ml-3 whitespace-nowrap transition-all duration-200 ease-in-out 
                                                ${isExpanded ? 'opacity-100 translate-x-0 delay-100' : 'opacity-0 -translate-x-4 absolute left-full'}`}
                                >
                                    {item.name}
                                </span>
                            </a>
                        </Link>
                    );
                })}
            </nav>

            {/* Optional: Footer or User Info in Sidebar */}
            <div className="border-t border-neutral-800/50 p-4 flex-shrink-0 overflow-hidden h-16 flex items-center justify-center">
                <p className={`text-xs text-neutral-500 transition-all duration-200 ease-in-out ${isExpanded ? 'opacity-100 delay-150' : 'opacity-0'}`}>
                    © Grill Shack Admin
                </p>
            </div>
        </aside>
    );
};

export default AdminSidebar;
