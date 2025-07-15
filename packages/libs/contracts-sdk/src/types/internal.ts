export interface PolicyWithParameters {
  policyIpfsCid: string;
  policyParameterValues: string;
}

export interface ToolWithPolicies {
  toolIpfsCid: string;
  policies: PolicyWithParameters[];
}

export interface PermissionDataOnChain {
  toolIpfsCids: string[];
  policyIpfsCids: string[][];
  policyParameterValues: string[][];
}
