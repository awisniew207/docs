import { AppVersionTool, AppVersion, ToolVersion } from "@/types/developer-dashboard/appTypes";
import { reactClient as vincentApiClient } from "@lit-protocol/vincent-registry-sdk";
import { useMemo, useEffect, useState, useCallback } from "react";

export type ConsentInfoMap = {
    versionsByApp: Record<string, AppVersion[]>;
    appVersionToolsByAppVersion: Record<string, AppVersionTool[]>;
    toolVersionsByAppVersionTool: Record<string, ToolVersion[]>;
    supportedPoliciesByToolVersion: Record<string, any[]>;
}

export type ConsentInfoState = {
    isLoading: boolean;
    isError: boolean;
    errors: string[];
    data: ConsentInfoMap & {
        appVersionToSupportedPolicyIpfsCids: Record<string, string[]>;
        policyVersionsByIpfsCid: Record<string, any>;
    };
}

export const useConsentInfo = (appId: string): ConsentInfoState => {
    const {
        data: appVersions,
        isLoading: appVersionsLoading,
        isError: appVersionsError,
        error: appVersionsErrorDetails,
    } = vincentApiClient.useGetAppVersionsQuery({ appId: Number(appId) });

    // Always call lazy queries at the top level
    const [triggerListAppVersionTools] = vincentApiClient.useLazyListAppVersionToolsQuery();
    const [triggerGetToolVersion] = vincentApiClient.useLazyGetToolVersionQuery();
    const [triggerGetPolicyVersion] = vincentApiClient.useLazyGetPolicyVersionQuery();

    const [versionToolsData, setVersionToolsData] = useState<Record<string, AppVersionTool[]>>({});
    const [toolVersionsData, setToolVersionsData] = useState<Record<string, ToolVersion>>({});
    const [supportedPoliciesData, setSupportedPoliciesData] = useState<Record<string, any[]>>({});
    const [errors, setErrors] = useState<string[]>([]);
    const [isLoadingAsync, setIsLoadingAsync] = useState(false);

    // Remove trigger functions from dependencies - they're stable
    const fetchVersionTools = useCallback(async () => {
        if (!appVersions || appVersions.length === 0) return;

        setIsLoadingAsync(true);
        const toolsData: Record<string, AppVersionTool[]> = {};
        const newErrors: string[] = [];
        
        for (const version of appVersions) {
            try {
                const result = await triggerListAppVersionTools({
                    appId: Number(appId),
                    version: Number(version.version),
                });
                
                const versionKey = `${appId}-${version.version}`;
                toolsData[versionKey] = result.data || [];
            } catch (error) {
                const errorMsg = `Failed to fetch tools for version ${version.version}: ${error}`;
                console.error(errorMsg);
                newErrors.push(errorMsg);
                const versionKey = `${appId}-${version.version}`;
                toolsData[versionKey] = [];
            }
        }
        
        setVersionToolsData(toolsData);
        setErrors(prev => [...prev, ...newErrors]);
        setIsLoadingAsync(false);
    }, [appVersions, appId]); // Removed triggerListAppVersionTools

    const fetchToolVersions = useCallback(async () => {
        if (Object.keys(versionToolsData).length === 0) return;

        setIsLoadingAsync(true);
        const toolVersions: Record<string, ToolVersion> = {};
        const newErrors: string[] = [];
        
        for (const [_, tools] of Object.entries(versionToolsData)) {
            for (const tool of tools) {
                try {
                    const result = await triggerGetToolVersion({
                        packageName: tool.toolPackageName,
                        version: tool.toolVersion,
                    });
                    
                    const toolKey = `${tool.toolPackageName}-${tool.toolVersion}`;
                    if (result.data) {
                        toolVersions[toolKey] = result.data;
                    }
                } catch (error) {
                    const errorMsg = `Failed to fetch tool version for ${tool.toolPackageName}: ${error}`;
                    console.error(errorMsg);
                    newErrors.push(errorMsg);
                }
            }
        }
        
        setToolVersionsData(toolVersions);
        setErrors(prev => [...prev, ...newErrors]);
        setIsLoadingAsync(false);
    }, [versionToolsData]); // Removed triggerGetToolVersion

    const fetchSupportedPolicies = useCallback(async () => {
        if (Object.keys(toolVersionsData).length === 0) return;

        setIsLoadingAsync(true);
        const policiesData: Record<string, any[]> = {};
        const newErrors: string[] = [];
        
        for (const [toolKey, toolVersion] of Object.entries(toolVersionsData)) {
            const toolPolicies: any[] = [];
            
            // Add null check for supportedPolicies
            if (toolVersion.supportedPolicies) {
                for (const [policyPackageName, policyVersion] of Object.entries(toolVersion.supportedPolicies)) {
                    try {
                        const result = await triggerGetPolicyVersion({
                            packageName: policyPackageName,
                            version: policyVersion,
                        });
                        
                        if (result.data) {
                            toolPolicies.push(result.data);
                        }
                    } catch (error) {
                        const errorMsg = `Failed to fetch policy ${policyPackageName}@${policyVersion}: ${error}`;
                        console.error(errorMsg);
                        newErrors.push(errorMsg);
                    }
                }
            }
            
            policiesData[toolKey] = toolPolicies;
        }
        
        setSupportedPoliciesData(policiesData);
        setErrors(prev => [...prev, ...newErrors]);
        setIsLoadingAsync(false);
    }, [toolVersionsData]); // Removed triggerGetPolicyVersion

    // Reset errors when appId changes
    useEffect(() => {
        setErrors([]);
    }, [appId]);

    // Fetch version tools when appVersions changes
    useEffect(() => {
        if (appVersions && appVersions.length > 0) {
            fetchVersionTools();
        }
    }, [fetchVersionTools]);

    // Fetch tool versions when version tools change
    useEffect(() => {
        if (Object.keys(versionToolsData).length > 0) {
            fetchToolVersions();
        }
    }, [fetchToolVersions]);

    // Fetch supported policies when tool versions change
    useEffect(() => {
        if (Object.keys(toolVersionsData).length > 0) {
            fetchSupportedPolicies();
        }
    }, [fetchSupportedPolicies]);

    // Construct ConsentInfoMap from available data
    const consentInfoMap = useMemo((): ConsentInfoMap => {
        const versionsByApp: Record<string, AppVersion[]> = {
            [appId]: appVersions || []
        };

        const appVersionToolsByAppVersion: Record<string, AppVersionTool[]> = {};
        (appVersions || []).forEach((version) => {
            const versionKey = `${appId}-${version.version}`;
            appVersionToolsByAppVersion[versionKey] = versionToolsData[versionKey] || [];
        });

        const toolVersionsByAppVersionTool: Record<string, ToolVersion[]> = {};
        Object.entries(toolVersionsData).forEach(([toolKey, toolVersion]) => {
            toolVersionsByAppVersionTool[toolKey] = [toolVersion];
        });

        const supportedPoliciesByToolVersion: Record<string, any[]> = { ...supportedPoliciesData };

        return {
            versionsByApp,
            appVersionToolsByAppVersion,
            toolVersionsByAppVersionTool,
            supportedPoliciesByToolVersion,
        };
    }, [appVersions, versionToolsData, toolVersionsData, supportedPoliciesData, appId]);

    // Compute mapping from app version to supported policy IPFS CIDs
    const appVersionToSupportedPolicyIpfsCids = useMemo((): Record<string, string[]> => {
        const mapping: Record<string, string[]> = {};
        
        (appVersions || []).forEach((version) => {
            const versionKey = `${appId}-${version.version}`;
            const ipfsCids: string[] = [];
            
            // Get tools for this app version
            const tools = versionToolsData[versionKey] || [];
            
            tools.forEach((tool) => {
                const toolKey = `${tool.toolPackageName}-${tool.toolVersion}`;
                
                // Get supported policies for this tool
                const policies = supportedPoliciesData[toolKey] || [];
                
                // Extract IPFS CIDs from each policy
                policies.forEach((policy) => {
                    if (policy.ipfsCid) {
                        ipfsCids.push(policy.ipfsCid);
                    }
                });
            });
            
            // Remove duplicates
            mapping[versionKey] = [...new Set(ipfsCids)];
        });
        
        return mapping;
    }, [appVersions, versionToolsData, supportedPoliciesData, appId]);

    // Create mapping from ipfsCid to policyVersion document
    const policyVersionsByIpfsCid = useMemo((): Record<string, any> => {
        const mapping: Record<string, any> = {};
        
        // Iterate through all tool versions and their policies
        Object.values(supportedPoliciesData).forEach((policies) => {
            policies.forEach((policy) => {
                if (policy.ipfsCid) {
                    mapping[policy.ipfsCid] = policy;
                }
            });
        });
        
        return mapping;
    }, [supportedPoliciesData]);

    return {
        isLoading: appVersionsLoading || isLoadingAsync,
        isError: appVersionsError || errors.length > 0,
        errors: appVersionsError ? [`Failed to fetch app versions: ${appVersionsErrorDetails}`] : errors,
        data: {
            ...consentInfoMap,
            appVersionToSupportedPolicyIpfsCids,
            policyVersionsByIpfsCid,
        }
    };
};