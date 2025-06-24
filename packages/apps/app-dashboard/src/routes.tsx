import { Outlet, RouteObject } from 'react-router';
import AppLayout from './components/layout/AppLayout';
import UserLayout from './components/layout/UserLayout';
import { AppProviders, UserProviders } from './providers';
import { wrap } from './utils/components';
import { AppDetailProvider } from './components/developer-dashboard/AppDetailContext';

import Home from './pages/index';
import Withdraw from './pages/withdraw';
import CreateApp from './pages/create-app';
import AppDetails from './pages/appId/[appId]/index';
import AdvancedFunctions from './pages/appId/[appId]/advanced-functions';
import Consent from './pages/appId/[appId]/consent';
import Delegatee from './pages/appId/[appId]/delegatee';
import ToolPolicies from './pages/appId/[appId]/tool-policies';
import { AppDashboard } from '@/pages/developer-dashboard';
import { AppDetail } from './pages/developer-dashboard/app';

const AppLayoutWithProviders = wrap(() => <Outlet />, [...AppProviders, AppLayout]);
const UserLayoutWithProviders = wrap(() => <Outlet />, [...UserProviders, UserLayout]);
const AppDetailWithProvider = wrap(() => <Outlet />, [AppDetailProvider]);

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
            path: 'create-app',
            element: <AppDashboard.CreateApp />,
          },
          {
            path: 'appId/:appId/*',
            element: <AppDetailWithProvider />,
            children: [
              {
                index: true,
                element: <AppDetail.Overview />,
              },
              {
                path: 'versions',
                element: <AppDetail.Versions />,
              },
              {
                path: 'version/:versionId',
                element: <AppDetail.Version />,
              },
              {
                path: 'version/:versionId/edit',
                element: <AppDetail.EditVersion />,
              },
              {
                path: 'edit-app',
                element: <AppDetail.Edit />,
              },
              {
                path: 'delete-app',
                element: <AppDetail.Delete />,
              },
              {
                path: 'create-app-version',
                element: <AppDetail.CreateVersion />,
              },
            ],
          },
        ],
      },
      {
        path: '/create-app',
        element: <CreateApp />,
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
