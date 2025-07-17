import { satisfies } from 'semver';

import { SUPPORTED_VINCENT_TOOL_API_RANGE } from './constants';

export function assertSupportedToolVersion(
  toolVersionSemver: string | undefined,
): asserts toolVersionSemver is string {
  if (
    !toolVersionSemver ||
    !satisfies(toolVersionSemver, SUPPORTED_VINCENT_TOOL_API_RANGE, { includePrerelease: true })
  ) {
    throw new Error(
      `Tool version ${toolVersionSemver} is not supported. Supported versions: ${SUPPORTED_VINCENT_TOOL_API_RANGE}`,
    );
  }
}
