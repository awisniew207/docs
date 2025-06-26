import { Outlet, RouteObject } from 'react-router';
import AppLayout from './components/layout/AppLayout';
import UserLayout from './components/layout/UserLayout';
import { AppProviders, UserProviders } from './providers';
import { wrap } from './utils/components';
import { AppRoute } from './components/developer-dashboard/data/AppDataProvider';

import Home from './pages/index';
import Withdraw from './pages/withdraw';
import AppDetails from './pages/appId/[appId]/index';
import AdvancedFunctions from './pages/appId/[appId]/advanced-functions';
import Consent from './pages/appId/[appId]/consent';
import Delegatee from './pages/appId/[appId]/delegatee';
import ToolPolicies from './pages/appId/[appId]/tool-policies';
import { AppDashboard } from '@/pages/developer-dashboard';

const AppLayoutWithProviders = wrap(() => <Outlet />, [...AppProviders, AppLayout]);
const UserLayoutWithProviders = wrap(() => <Outlet />, [...UserProviders, UserLayout]);

const routes: RouteObject[] = [
  {
    element: <AppLayoutWithProviders />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/developer',
        element: <AppDashboard.ConnectWallet />,
      },
      {
        path: '/developer/*',
        element: <Outlet />,
        children: [
          {
            path: 'dashboard',
            element: <AppDashboard.Dashboard />,
          },
          {
            path: 'apps',
            element: <AppDashboard.Apps />,
          },
          {
            path: 'create-app/*',
            element: <AppRoute />,
          },
          // App-level routes
          {
            path: 'appId/:appId',
            element: <AppRoute />,
          },
          {
            path: 'appId/:appId/edit-app',
            element: <AppRoute />,
          },
          {
            path: 'appId/:appId/delete-app',
            element: <AppRoute />,
          },
          {
            path: 'appId/:appId/versions',
            element: <AppRoute />,
          },
          {
            path: 'appId/:appId/create-app-version',
            element: <AppRoute />,
          },
          // Version-level routes
          {
            path: 'appId/:appId/version/:versionId',
            element: <AppRoute />,
          },
          {
            path: 'appId/:appId/version/:versionId/edit',
            element: <AppRoute />,
          },
          {
            path: 'appId/:appId/version/:versionId/tools',
            element: <AppRoute />,
          },
        ],
      },
      {
        path: '/appId/:appId',
        element: <AppDetails />,
      },
      {
        path: '/appId/:appId/advanced-functions',
        element: <AdvancedFunctions />,
      },
      {
        path: '/appId/:appId/delegatee',
        element: <Delegatee />,
      },
      {
        path: '/appId/:appId/tool-policies',
        element: <ToolPolicies />,
      },
    ],
  },
  {
    element: <UserLayoutWithProviders />,
    children: [
      {
        path: '/withdraw',
        element: <Withdraw />,
      },
      {
        path: '/appId/:appId/consent',
        element: <Consent />,
      },
    ],
  },
];

export default routes;
