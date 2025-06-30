import { Outlet, RouteObject } from 'react-router';
import AppLayout from './components/layout/AppLayout';
import UserLayout from './components/layout/UserLayout';
import { AppProviders, UserProviders } from './providers';
import { wrap } from './utils/components';
import {
  AppEdit,
  AppOverview,
  AppDelete,
  CreateAppPage,
  AppVersions,
  AppVersionDetail,
  AppVersionTools,
  AppCreateVersion,
  AppEditVersion,
  AppsPage,
} from './pages/developer-dashboard/app';
import { ToolsPage } from './pages/developer-dashboard/tool';
import {
  ToolOverviewWrapper,
  CreateToolWrapper,
  EditToolWrapper,
  CreateToolVersionWrapper,
  ChangeToolOwnerWrapper,
  ToolVersionsWrapper,
  ToolVersionDetailsWrapper,
  EditToolVersionWrapper,
  DeleteToolWrapper,
} from './components/developer-dashboard/tool/wrappers';
import { PoliciesPage } from './pages/developer-dashboard/policy';
import {
  PolicyOverviewWrapper,
  CreatePolicyWrapper,
  EditPolicyWrapper,
  CreatePolicyVersionWrapper,
  ChangePolicyOwnerWrapper,
  PolicyVersionsWrapper,
  PolicyVersionDetailsWrapper,
  EditPolicyVersionWrapper,
  DeletePolicyWrapper,
} from './components/developer-dashboard/policy/wrappers';

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
            element: <AppsPage />,
          },
          {
            path: 'create-app/*',
            element: <CreateAppPage />,
          },
          {
            path: 'appId/:appId',
            element: <AppOverview />,
          },
          {
            path: 'appId/:appId/edit-app',
            element: <AppEdit />,
          },
          {
            path: 'appId/:appId/delete-app',
            element: <AppDelete />,
          },
          {
            path: 'appId/:appId/versions',
            element: <AppVersions />,
          },
          {
            path: 'appId/:appId/create-app-version',
            element: <AppCreateVersion />,
          },
          {
            path: 'appId/:appId/version/:versionId',
            element: <AppVersionDetail />,
          },
          {
            path: 'appId/:appId/version/:versionId/edit',
            element: <AppEditVersion />,
          },
          {
            path: 'appId/:appId/version/:versionId/tools',
            element: <AppVersionTools />,
          },
          {
            path: 'tools',
            element: <ToolsPage />,
          },
          {
            path: 'create-tool',
            element: <CreateToolWrapper />,
          },
          {
            path: 'toolId/:packageName',
            element: <ToolOverviewWrapper />,
          },
          {
            path: 'toolId/:packageName/edit-tool',
            element: <EditToolWrapper />,
          },
          {
            path: 'toolId/:packageName/create-tool-version',
            element: <CreateToolVersionWrapper />,
          },
          {
            path: 'toolId/:packageName/change-tool-owner',
            element: <ChangeToolOwnerWrapper />,
          },
          {
            path: 'toolId/:packageName/versions',
            element: <ToolVersionsWrapper />,
          },
          {
            path: 'toolId/:packageName/version/:version',
            element: <ToolVersionDetailsWrapper />,
          },
          {
            path: 'toolId/:packageName/version/:version/edit-version',
            element: <EditToolVersionWrapper />,
          },
          {
            path: 'toolId/:packageName/delete-tool',
            element: <DeleteToolWrapper />,
          },
          {
            path: 'policies',
            element: <PoliciesPage />,
          },
          {
            path: 'create-policy',
            element: <CreatePolicyWrapper />,
          },
          {
            path: 'policyId/:packageName',
            element: <PolicyOverviewWrapper />,
          },
          {
            path: 'policyId/:packageName/edit-policy',
            element: <EditPolicyWrapper />,
          },
          {
            path: 'policyId/:packageName/create-policy-version',
            element: <CreatePolicyVersionWrapper />,
          },
          {
            path: 'policyId/:packageName/change-policy-owner',
            element: <ChangePolicyOwnerWrapper />,
          },
          {
            path: 'policyId/:packageName/versions',
            element: <PolicyVersionsWrapper />,
          },
          {
            path: 'policyId/:packageName/version/:version',
            element: <PolicyVersionDetailsWrapper />,
          },
          {
            path: 'policyId/:packageName/version/:version/edit-version',
            element: <EditPolicyVersionWrapper />,
          },
          {
            path: 'policyId/:packageName/delete-policy',
            element: <DeletePolicyWrapper />,
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
