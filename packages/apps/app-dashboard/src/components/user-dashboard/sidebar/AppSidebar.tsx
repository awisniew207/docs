import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Loader2,
  Sun,
  Moon,
  LogOut,
  TriangleAlert,
  HelpCircle,
  ChevronDown,
  User,
  Code,
} from 'lucide-react';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { toggleTheme } from '@/lib/theme';
import { useTheme } from '@/hooks/useTheme';
import { App } from '@/types/developer-dashboard/appTypes';
import { SidebarLogo } from './SidebarLogo';
import { useClearAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { AccountTooltip } from '@/components/shared/AccountTooltip';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
} from '@/components/shared/ui/sidebar';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  type: 'link' | 'section';
  children?: MenuItem[];
  hasVersionMismatch?: boolean;
  warningType?: 'yellow' | 'orange' | 'red' | null;
  permittedVersionEnabled?: boolean | null;
  activeVersionEnabled?: boolean | null;
}

const getMainMenuItems = (
  apps: App[],
  isLoadingApps: boolean,
  permittedAppVersions: Record<string, string> = {},
  appVersionsMap: Record<string, any[]> = {},
): MenuItem[] => {
  return [
    {
      id: 'apps',
      label: 'Apps',
      icon: <Package className="h-4 w-4" />,
      route: '/user/apps',
      type: 'section',
      children: isLoadingApps
        ? [
            {
              id: 'loading',
              label: 'Loading...',
              icon: <Loader2 className="h-4 w-4 animate-spin" />,
              route: '#',
              type: 'link',
            },
          ]
        : apps.length === 0
          ? [
              {
                id: 'no-apps',
                label: 'No Apps',
                icon: <Package className="h-4 w-4 opacity-50" />,
                route: '#',
                type: 'link',
              },
            ]
          : apps.map((app) => {
              const appId = app.appId.toString();
              const permittedVersion = permittedAppVersions[appId];
              const activeVersion = app.activeVersion?.toString();
              const appVersions = appVersionsMap[appId] || [];

              // Find version objects
              const permittedVersionObj = appVersions.find(
                (v) => v.version.toString() === permittedVersion,
              );
              const activeVersionObj = appVersions.find(
                (v) => v.version.toString() === activeVersion,
              );

              // Check enabled status
              const permittedVersionEnabled = permittedVersionObj?.enabled ?? null;
              const activeVersionEnabled = activeVersionObj?.enabled ?? null;

              // Determine warning type and color
              const hasVersionMismatch = !!(
                permittedVersion &&
                activeVersion &&
                permittedVersion !== activeVersion
              );
              let warningType: 'yellow' | 'orange' | 'red' | null = null;

              // Check for version mismatch first (lowest priority)
              if (hasVersionMismatch) {
                warningType = 'yellow'; // Version mismatch - yellow warning
              }

              // Check if either version is disabled (medium priority)
              if (permittedVersionEnabled === false || activeVersionEnabled === false) {
                warningType = 'orange'; // Either version disabled - orange warning
              }

              // Check if both versions are disabled (highest priority)
              if (permittedVersionEnabled === false && activeVersionEnabled === false) {
                warningType = 'red'; // Both versions disabled - red warning
              }

              return {
                id: appId,
                label: app.name,
                icon: <SidebarLogo logo={app.logo} alt={`${app.name} logo`} />,
                route: `/user/appId/${app.appId}`,
                type: 'link' as const,
                hasVersionMismatch,
                warningType,
                permittedVersionEnabled,
                activeVersionEnabled,
              };
            }),
    },
  ];
};

interface AppSidebarProps {
  apps: App[];
  permittedAppVersions?: Record<string, string>;
  appVersionsMap?: Record<string, any[]>;
  isLoadingApps?: boolean;
}

export function AppSidebar({
  apps = [],
  permittedAppVersions = {},
  appVersionsMap = {},
  isLoadingApps = false,
}: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearAuthInfo } = useClearAuthInfo();
  const isDark = useTheme();
  const [showDashboardMenu, setShowDashboardMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDashboardMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = getMainMenuItems(apps, isLoadingApps, permittedAppVersions, appVersionsMap);

  const isActiveRoute = (route: string) => {
    return location.pathname.startsWith(route);
  };

  const handleSignOut = async () => {
    await clearAuthInfo();
  };

  const handleWarningClick = (appId: string) => {
    navigate(`/user/appId/${appId}/update-version`);
  };

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border h-16">
        <div className="flex items-center px-6 py-4 h-full">
          <div className="relative flex-1" ref={dropdownRef}>
            <button
              onClick={() => setShowDashboardMenu(!showDashboardMenu)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
                showDashboardMenu
                  ? isDark
                    ? 'bg-white/10'
                    : 'bg-gray-900/5'
                  : isDark
                    ? 'hover:bg-white/5'
                    : 'hover:bg-gray-900/5'
              }`}
              aria-label="Switch dashboard"
            >
              <img
                src={isDark ? '/vincent-main-logo-white.png' : '/vincent-main-logo.png'}
                alt="Vincent by Lit Protocol"
                className="h-6 object-contain"
              />
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  showDashboardMenu ? 'rotate-180' : ''
                } ${isDark ? 'text-white/60' : 'text-gray-900/60'}`}
              />
            </button>

            {/* Dashboard Switcher Dropdown */}
            {showDashboardMenu && (
              <div
                className={`absolute top-full left-0 mt-2 w-48 rounded-lg shadow-lg border ${
                  isDark ? 'bg-neutral-900 border-white/10' : 'bg-white border-gray-200'
                } z-50`}
              >
                <div className="p-1">
                  <button
                    onClick={() => {
                      navigate('/user/apps');
                      setShowDashboardMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-md transition-colors ${
                      location.pathname.startsWith('/user')
                        ? `${theme.itemBg} text-orange-500`
                        : `${theme.itemHoverBg} ${theme.text}`
                    }`}
                  >
                    <User className="h-3.5 w-3.5 flex-shrink-0" />
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">User Dashboard</div>
                      <div className={`text-[10px] ${theme.textMuted} truncate`}>
                        Manage your apps
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/developer/dashboard');
                      setShowDashboardMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-md transition-colors ${
                      location.pathname.startsWith('/developer')
                        ? `${theme.itemBg} text-orange-500`
                        : `${theme.itemHoverBg} ${theme.text}`
                    }`}
                  >
                    <Code className="h-3.5 w-3.5 flex-shrink-0" />
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">Developer Dashboard</div>
                      <div className={`text-[10px] ${theme.textMuted} truncate`}>
                        Build apps & abilities
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarGroup className="space-y-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => {
                return (
                  <SidebarMenuItem key={item.id}>
                    {item.type === 'link' ? (
                      <SidebarMenuButton
                        asChild
                        isActive={isActiveRoute(item.route)}
                        className={`h-10 px-3 rounded-lg transition-all duration-200 ${
                          isActiveRoute(item.route)
                            ? `${theme.itemBg} text-orange-500 font-semibold`
                            : `${theme.text} ${theme.itemHoverBg}`
                        }`}
                      >
                        <Link to={item.route} className="flex items-center gap-3">
                          <div
                            className={`${isActiveRoute(item.route) ? 'text-orange-500' : theme.textMuted} [&>svg]:!w-5 [&>svg]:!h-5`}
                          >
                            {item.icon}
                          </div>
                          <span
                            className={`font-medium ${isActiveRoute(item.route) ? 'text-orange-500' : theme.text}`}
                          >
                            {item.label}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      <>
                        <SidebarMenuButton
                          asChild
                          isActive={isActiveRoute(item.route)}
                          className={`h-10 px-3 rounded-lg transition-all duration-200 cursor-pointer ${
                            isActiveRoute(item.route)
                              ? `${theme.itemBg} text-orange-500 font-semibold`
                              : `${theme.text} ${theme.itemHoverBg}`
                          }`}
                        >
                          <Link to={item.route} className="flex items-center gap-3 w-full">
                            <div
                              className={`${isActiveRoute(item.route) ? 'text-orange-500' : theme.textMuted} [&>svg]:!w-5 [&>svg]:!h-5`}
                            >
                              {item.icon}
                            </div>
                            <span
                              className={`font-medium ${isActiveRoute(item.route) ? 'text-orange-500' : theme.text}`}
                            >
                              {item.label}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuSub className="ml-6 mt-2 space-y-1">
                          {item.children?.map((child) => {
                            return (
                              <SidebarMenuSubItem key={child.id} className="relative">
                                {child.warningType && (
                                  <div className="absolute left-[-40px] top-1/2 transform -translate-y-1/2 z-10">
                                    <div className="relative group/triangle">
                                      <TriangleAlert
                                        className={`h-4 w-4 transition-colors cursor-pointer ${
                                          child.warningType === 'yellow'
                                            ? 'text-yellow-500 hover:text-yellow-400'
                                            : child.warningType === 'orange'
                                              ? 'text-orange-500 hover:text-orange-400'
                                              : child.warningType === 'red'
                                                ? 'text-red-500 hover:text-red-400'
                                                : 'text-yellow-500 hover:text-yellow-400'
                                        }`}
                                        onClick={() => handleWarningClick(child.id)}
                                      />
                                      <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/triangle:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                        <div className="bg-neutral-900 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap shadow-lg">
                                          {child.warningType === 'yellow' && (
                                            <>
                                              <div className="font-medium">
                                                New Version Available
                                              </div>
                                              <div className="text-gray-300">
                                                Permitted: v{permittedAppVersions[child.id]} |
                                                Active: v
                                                {
                                                  apps.find(
                                                    (app) => app.appId.toString() === child.id,
                                                  )?.activeVersion
                                                }
                                              </div>
                                            </>
                                          )}
                                          {child.warningType === 'orange' && (
                                            <>
                                              <div className="font-medium">
                                                {child.permittedVersionEnabled === false &&
                                                child.activeVersionEnabled === false
                                                  ? 'Both Versions Disabled'
                                                  : child.permittedVersionEnabled === false
                                                    ? 'Permitted Version Disabled'
                                                    : 'Active Version Disabled'}
                                              </div>
                                              <div className="text-gray-300">
                                                {child.permittedVersionEnabled === false &&
                                                child.activeVersionEnabled === false
                                                  ? `Both permitted v${permittedAppVersions[child.id]} and active v${apps.find((app) => app.appId.toString() === child.id)?.activeVersion} are disabled`
                                                  : child.permittedVersionEnabled === false
                                                    ? `Your permitted version v${permittedAppVersions[child.id]} is disabled`
                                                    : `The active version v${apps.find((app) => app.appId.toString() === child.id)?.activeVersion} is disabled`}
                                              </div>
                                            </>
                                          )}
                                          {child.warningType === 'red' && (
                                            <>
                                              <div className="font-medium">
                                                Permitted + Active Versions Disabled
                                              </div>
                                              <div className="text-gray-300">
                                                Permitted v{permittedAppVersions[child.id]} and
                                                Active v
                                                {
                                                  apps.find(
                                                    (app) => app.appId.toString() === child.id,
                                                  )?.activeVersion
                                                }{' '}
                                                are disabled
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isActiveRoute(child.route)}
                                  className={`h-10 px-3 rounded-md transition-all duration-200 ${
                                    isActiveRoute(child.route)
                                      ? `${theme.itemBg} text-orange-500 font-medium`
                                      : `${theme.textMuted} ${theme.itemHoverBg}`
                                  }`}
                                >
                                  <Link to={child.route} className="flex items-center gap-2">
                                    <div
                                      className={`${isActiveRoute(child.route) ? 'text-orange-500' : theme.textMuted} [&>svg]:!w-5 [&>svg]:!h-5`}
                                    >
                                      {child.icon}
                                    </div>
                                    <span
                                      className={`text-sm ${isActiveRoute(child.route) ? `text-orange-500 font-medium` : theme.textMuted}`}
                                    >
                                      {child.label}
                                    </span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="my-0" />

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-4 space-y-2">
          <SidebarMenu>
            {/* My Account with tooltip */}
            <SidebarMenuItem>
              <AccountTooltip theme={theme} />
            </SidebarMenuItem>

            {/* Sign Out */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleSignOut}
                className={`h-10 px-3 rounded-lg transition-all duration-200 ${theme.text} ${theme.itemHoverBg}`}
              >
                <div className="flex items-center gap-3">
                  <div className={theme.textMuted}>
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span className={`font-medium ${theme.text}`}>Sign out</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div className={`border-t ${isDark ? 'border-white/10' : 'border-gray-900/10'} my-2`} />

          <SidebarMenu>
            {/* FAQ */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className={`h-10 px-3 rounded-lg transition-all duration-200 ${theme.text} ${theme.itemHoverBg}`}
              >
                <Link to="/faq">
                  <div className="flex items-center gap-3">
                    <div className={theme.textMuted}>
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <span className={`font-medium ${theme.text}`}>FAQ</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Theme Toggle */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={toggleTheme}
                className={`h-10 px-3 rounded-lg transition-all duration-200 ${theme.text} ${theme.itemHoverBg}`}
              >
                <div className="flex items-center gap-3">
                  <div className={theme.textMuted}>
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </div>
                  <span className={`font-medium ${theme.text}`}>
                    {isDark ? 'Light mode' : 'Dark mode'}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
