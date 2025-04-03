'use client';

import React from 'react';
import '../../app/dashboard.css';

interface DashboardStyleWrapperProps {
  children: React.ReactNode;
}

export default function DashboardStyleWrapper({ children }: DashboardStyleWrapperProps) {
  return <>{children}</>;
} 