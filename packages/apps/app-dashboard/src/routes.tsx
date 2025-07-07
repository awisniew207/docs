import { Outlet, RouteObject } from 'react-router';
import AppLayout from '@/layout/app-dashboard/AppLayout';
import UserLayout from '@/layout/user-dashboard/UserLayout';
import { AppProviders, UserProviders } from './providers';
import { wrap } from '@/utils/shared/components';

import { ConnectWallet, Dashboard } from './pages/developer-dashboard';

import {
  AppsWrapper,
  AppOverviewWrapper,
  AppVersionDetailWrapper,
  AppVersionsWrapper,
  AppVersionToolsWrapper,
  CreateAppVersionWrapper,
  EditAppVersionWrapper,
  EditAppWrapper,
  DeleteAppWrapper,
  CreateAppWrapper,
  DeleteAppVersionWrapper,
} from './components/developer-dashboard/app/wrappers';

import {
  ToolsWrapper,
  ToolOverviewWrapper,
  CreateToolWrapper,
  EditToolWrapper,
  CreateToolVersionWrapper,
  ChangeToolOwnerWrapper,
  ToolVersionsWrapper,
  ToolVersionDetailsWrapper,
  EditToolVersionWrapper,
  DeleteToolWrapper,
  DeleteToolVersionWrapper,
} from './components/developer-dashboard/tool/wrappers';

import {
  PoliciesWrapper,
  PolicyOverviewWrapper,
  CreatePolicyWrapper,
  EditPolicyWrapper,
  CreatePolicyVersionWrapper,
  ChangePolicyOwnerWrapper,
  PolicyVersionsWrapper,
  PolicyVersionDetailsWrapper,
  EditPolicyVersionWrapper,
  DeletePolicyWrapper,
  DeletePolicyVersionWrapper,
} from './components/developer-dashboard/policy/wrappers';

import Home from './pages/shared/home';
import Withdraw from './pages/user-dashboard/wallet';
import AppDetails from './pages/user-dashboard/app-details';

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
        element: <ConnectWallet />,
      },
      {
        path: '/developer/*',
        element: <Outlet />,
        children: [
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'apps',
            element: <AppsWrapper />,
          },
          {
            path: 'create-app/*',
            element: <CreateAppWrapper />,
          },
          {
            path: 'appId/:appId',
            element: <AppOverviewWrapper />,
          },
          {
            path: 'appId/:appId/edit-app',
            element: <EditAppWrapper />,
          },
          {
            path: 'appId/:appId/delete-app',
            element: <DeleteAppWrapper />,
          },
          {
            path: 'appId/:appId/versions',
            element: <AppVersionsWrapper />,
          },
          {
            path: 'appId/:appId/create-app-version',
            element: <CreateAppVersionWrapper />,
          },
          {
            path: 'appId/:appId/version/:versionId',
            element: <AppVersionDetailWrapper />,
          },
          {
            path: 'appId/:appId/version/:versionId/edit',
            element: <EditAppVersionWrapper />,
          },
          {
            path: 'appId/:appId/version/:versionId/tools',
            element: <AppVersionToolsWrapper />,
          },
          {
            path: 'appId/:appId/version/:versionId/delete-version',
            element: <DeleteAppVersionWrapper />,
          },
          {
            path: 'tools',
            element: <ToolsWrapper />,
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
            path: 'toolId/:packageName/version/:version/delete-version',
            element: <DeleteToolVersionWrapper />,
          },
          {
            path: 'policies',
            element: <PoliciesWrapper />,
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
          {
            path: 'policyId/:packageName/version/:version/delete-version',
            element: <DeletePolicyVersionWrapper />,
          },
        ],
      },
      {
        path: '/appId/:appId',
        element: <AppDetails />,
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
    ],
  },
];

export default routes;
