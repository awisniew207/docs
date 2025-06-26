import { VersionDetails } from '../VersionDetails';

interface VersionDetailsWrapperProps {
  version: number;
  appName?: string;
  versionData: any;
  tools?: any[];
}

export function VersionDetailsWrapper({
  version,
  appName,
  versionData,
  tools = [],
}: VersionDetailsWrapperProps) {
  return (
    <VersionDetails version={version} appName={appName} versionData={versionData} tools={tools} />
  );
}
