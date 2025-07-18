import React, { useState } from 'react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from '@radix-ui/react-navigation-menu';
import { useLocation, Link } from 'react-router-dom';
import { Home, Smartphone, Wallet, House, ChevronRight, Loader2 } from 'lucide-react';
import './Sidebar.css';
import { App } from '@/types/developer-dashboard/appTypes';
import { Logo } from '@/components/shared/ui/Logo';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  type: 'link' | 'section';
  children?: MenuItem[];
  component?: React.ComponentType;
}

const getMenuItems = (apps: App[], isLoadingApps: boolean): MenuItem[] => [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home className="w-5 h-5" />,
    route: '/user/dashboard',
    type: 'link',
  },
  {
    id: 'apps',
    label: 'Apps',
    icon: <Smartphone className="w-5 h-5" />,
    route: '',
    type: 'section',
    children: isLoadingApps
      ? []
      : [
          ...apps.map((app) => ({
            id: `app-${app.appId}`,
            label: app.name,
            icon: <Logo logo={app.logo} alt={`${app.name} logo`} className="w-5 h-5 rounded" />,
            route: `/user/apps/${app.appId}/details`,
            type: 'link' as const,
          })),
        ],
  },
  {
    id: 'withdraw',
    label: 'Withdraw',
    icon: <Wallet className="w-5 h-5" />,
    route: '/user/withdraw',
    type: 'link',
  },
  {
    id: 'home',
    label: 'Home',
    icon: <House className="w-5 h-5" />,
    route: '/user',
    type: 'link',
  },
];

export function Sidebar({ apps, isLoadingApps }: { apps: App[]; isLoadingApps: boolean }) {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['apps']));

  const isActive = (route: string) => location.pathname === route;

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const menuItems = getMenuItems(apps, isLoadingApps);

  const renderMenuItem = (item: MenuItem) => {
    if (item.type === 'section') {
      const isExpanded = expandedSections.has(item.id);
      const hasChildren = item.children && item.children.length > 0;

      return (
        <div key={item.id}>
          <NavigationMenuItem>
            <div
              className="sidebar-section-header sidebar-section-toggle"
              onClick={() => hasChildren && toggleSection(item.id)}
              style={{ cursor: hasChildren ? 'pointer' : 'default' }}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
              {hasChildren && (
                <ChevronRight className={`sidebar-chevron ${isExpanded ? 'expanded' : ''}`} />
              )}
            </div>
          </NavigationMenuItem>
          {item.component && <item.component />}
          {/* Show loading spinner in Apps section when loading */}
          {item.id === 'apps' && isLoadingApps && isExpanded && (
            <NavigationMenuItem>
              <div className="sidebar-sublink" style={{ opacity: 0.7 }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading apps...
              </div>
            </NavigationMenuItem>
          )}
          {hasChildren && isExpanded && item.children?.map((child) => renderMenuItem(child))}
        </div>
      );
    }

    return (
      <NavigationMenuItem key={item.id}>
        <NavigationMenuLink asChild>
          <Link
            to={item.route}
            className={item.children ? 'sidebar-sublink' : 'sidebar-link'}
            data-active={isActive(item.route) ? '' : undefined}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {item.label}
          </Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    );
  };

  return (
    <div className="sidebar-container">
      <NavigationMenu orientation="vertical" className="sidebar-nav">
        <NavigationMenuList className="sidebar-list">
          {menuItems.map((item) => renderMenuItem(item))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
