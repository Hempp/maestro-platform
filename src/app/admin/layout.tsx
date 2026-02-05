'use client';

/**
 * ADMIN LAYOUT
 * Collapsible sidebar navigation for admin portal
 * Inspired by Supabase dashboard - collapse to icons, expand for labels
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AdminTier, AdminPermission, ADMIN_TIER_INFO, TIER_PERMISSIONS } from '@/types';

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  collapsed: boolean;
}

function NavItem({ href, label, icon, active, collapsed }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-cyan-500/20 text-cyan-400'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
      } ${collapsed ? 'justify-center' : ''}`}
      title={collapsed ? label : undefined}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}

      {/* Tooltip on hover when collapsed */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none">
          {label}
        </div>
      )}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [adminTier, setAdminTier] = useState<AdminTier | null>(null);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [checkingRole, setCheckingRole] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    if (saved !== null) {
      setCollapsed(saved === 'true');
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('adminSidebarCollapsed', String(newState));
  };

  useEffect(() => {
    async function checkRole() {
      if (!user) {
        setCheckingRole(false);
        return;
      }

      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.user?.role || 'learner');

          // Fetch admin_tier and set permissions
          const tier = data.user?.admin_tier as AdminTier | null;
          setAdminTier(tier);
          if (tier && TIER_PERMISSIONS[tier]) {
            setPermissions(TIER_PERMISSIONS[tier]);
          }
        }
      } catch (error) {
        console.error('Failed to check role:', error);
      }
      setCheckingRole(false);
    }

    if (!loading) {
      checkRole();
    }
  }, [user, loading]);

  // PREVIEW MODE - set to false for production
  const PREVIEW_MODE = false;

  // Redirect if not admin/teacher
  useEffect(() => {
    if (PREVIEW_MODE) return;
    if (!loading && !checkingRole) {
      if (!user) {
        router.push('/login');
      } else if (userRole && !['admin', 'teacher'].includes(userRole)) {
        router.push('/dashboard');
      }
    }
  }, [user, userRole, loading, checkingRole, router]);

  if (!PREVIEW_MODE && (loading || checkingRole)) {
    return (
      <div className="min-h-screen bg-[#1a1d21] flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!PREVIEW_MODE && (!user || (userRole && !['admin', 'teacher'].includes(userRole)))) {
    return null;
  }

  const navItems = [
    {
      href: '/admin',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      href: '/admin/students',
      label: 'Students',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      href: '/admin/courses',
      label: 'Courses',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      href: '/admin/live',
      label: 'Live Sessions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: '/admin/analytics',
      label: 'Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      href: '/admin/team',
      label: 'Team',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#1a1d21] flex">
      {/* Sidebar */}
      <aside
        className={`border-r border-slate-800/50 flex flex-col bg-[#1a1d21] flex-shrink-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className={`p-4 border-b border-slate-800/50 ${collapsed ? 'flex justify-center' : ''}`}>
          <Link href="/admin" className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <Image src="/logo.png" alt="Phazur" width={36} height={36} className="invert flex-shrink-0" />
            {!collapsed && (
              <div>
                <span className="text-white font-semibold text-lg">Phazur</span>
                <span className="ml-2 px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                  Admin
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 p-2 space-y-1 ${collapsed ? 'px-2' : 'p-4'}`}>
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* Collapse Toggle */}
        <div className={`px-2 pb-2 ${collapsed ? 'flex justify-center' : 'px-4'}`}>
          <button
            onClick={toggleCollapsed}
            className={`flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-all w-full ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {!collapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>

        {/* User section */}
        <div className={`p-4 border-t border-slate-800/50 ${collapsed ? 'px-2' : ''}`}>
          {collapsed ? (
            /* Collapsed user section - just avatar */
            <div className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <Link
                href="/dashboard"
                className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800/50"
                title="Back to Dashboard"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
              </Link>
            </div>
          ) : (
            /* Expanded user section */
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {user?.email?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{user?.email}</div>
                  <div className="text-xs text-slate-500 capitalize">{userRole}</div>
                  {adminTier && ADMIN_TIER_INFO[adminTier] && (
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                        ADMIN_TIER_INFO[adminTier].color === 'red' ? 'bg-red-500/20 text-red-400' :
                        ADMIN_TIER_INFO[adminTier].color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                        ADMIN_TIER_INFO[adminTier].color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                        ADMIN_TIER_INFO[adminTier].color === 'green' ? 'bg-green-500/20 text-green-400' :
                        ADMIN_TIER_INFO[adminTier].color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {ADMIN_TIER_INFO[adminTier].label}
                    </span>
                  )}
                </div>
              </div>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Back to Dashboard
              </Link>
            </>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
