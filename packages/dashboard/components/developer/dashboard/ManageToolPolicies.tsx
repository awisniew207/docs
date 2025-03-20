"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { AppView } from "@/services/types";
import { VincentContracts } from "@/services";
import { mapTypeToEnum, mapEnumToTypeName, ParameterType } from "@/services/types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Define the types explicitly since they're not exported from services/types
interface ToolPolicy {
    toolIpfsCid?: string;
    policyVarsSchema?: Array<PolicyParamSchema>;
    policies?: any[];
    [key: string]: any; // To allow other properties
}

interface PolicyParamSchema {
    paramName?: string;
    defaultValue?: string;
    valueType?: string;
    [key: string]: any; // To allow other properties
}

interface ToolPolicyWithId extends ToolPolicy {
    _id?: string; // Frontend-only ID for mapping
    policyVarsSchema: PolicyParamSchemaWithId[];
}

interface PolicyParamSchemaWithId extends PolicyParamSchema {
    _id?: string; // Frontend-only ID for mapping
}

interface ToolPolicyManagerProps {
    onBack: () => void;
    dashboard: AppView;
}

export default function ManageToolPoliciesScreen({
    onBack,
    dashboard,
}: ToolPolicyManagerProps) {
    const [toolPolicies, setToolPolicies] = useState<ToolPolicyWithId[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingTools, setExistingTools] = useState<any[]>([]);

    // Fetch existing tools and policies on component mount
    useEffect(() => {
        async function fetchAppVersion() {
            if (dashboard?.appId) {
                try {
                    setIsLoading(true);
                    const contracts = new VincentContracts('datil');
                    // Get the latest version
                    const appVersion = await contracts.getAppVersion(dashboard.appId, dashboard.currentVersion);
                    console.log("Fetched app version:", appVersion);
                    
                    // Extract tools from the version data
                    const tools = appVersion?.tools || appVersion?.[3] || [];
                    setExistingTools(tools);
                    
                    // Convert the fetched tools into our ToolPolicyWithId format
                    const formattedTools = tools.map((tool: any) => {
                        // Extract tool data
                        const toolData = Array.isArray(tool) 
                            ? { 
                                toolIpfsCid: tool[0], 
                                policies: Array.isArray(tool[1]) ? tool[1] : [] 
                              } 
                            : tool;
                        
                        // Format the tool with an ID and extract its policies
                        const formattedTool: ToolPolicyWithId = {
                            _id: crypto.randomUUID(),
                            toolIpfsCid: toolData.toolIpfsCid || "",
                            description: toolData.description || "",
                            policyVarsSchema: []
                        };
                        
                        // Process policies into parameter schemas
                        if (toolData.policies && toolData.policies.length > 0) {
                            // Convert each policy's parameters to our schema format
                            toolData.policies.forEach((policy: any) => {
                                const policyData = Array.isArray(policy)
                                    ? { 
                                        policyIpfsCid: policy[0] || '', 
                                        parameterNames: Array.isArray(policy[1]) ? policy[1] : [],
                                        parameterTypes: Array.isArray(policy[2]) ? policy[2] : []
                                      }
                                    : policy || {};
                                
                                // Add each parameter as a schema item
                                if (policyData.parameterNames && policyData.parameterNames.length) {
                                    policyData.parameterNames.forEach((name: string, index: number) => {
                                        const typeValue = policyData.parameterTypes[index];
                                        const typeName = mapEnumToTypeName(Number(typeValue)) || "string";
                                        
                                        formattedTool.policyVarsSchema.push({
                                            _id: crypto.randomUUID(),
                                            paramName: name,
                                            valueType: typeName,
                                            defaultValue: ""
                                        });
                                    });
                                }
                            });
                        }
                        
                        return formattedTool;
                    });
                    
                    setToolPolicies(formattedTools);
                } catch (error) {
                    console.error("Error fetching app version:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        }
        
        fetchAppVersion();
    }, [dashboard]);

    const handleAddTool = () => {
        const newTool: ToolPolicyWithId = {
            _id: crypto.randomUUID(),
            toolIpfsCid: "",
            description: "",
            policyVarsSchema: [{
                _id: crypto.randomUUID(),
                paramName: "",
                valueType: "string",
                defaultValue: ""
            } as PolicyParamSchemaWithId]
        };
        setToolPolicies([...toolPolicies, newTool]);
    };

    const addPolicy = () => {
        setToolPolicies(prev => [...prev, generateNewPolicy()]);
    };

    const addSchema = (policyId: string) => {
        setToolPolicies(prev => 
            prev.map(policy => 
                policy._id === policyId 
                    ? {
                        ...policy,
                        policyVarsSchema: [
                            ...policy.policyVarsSchema,
                            {
                                _id: crypto.randomUUID(),
                                paramName: "",
                                valueType: "string",
                                defaultValue: ""
                            }
                        ]
                    } 
                    : policy
            )
        );
    };

    const removeSchema = (policyId: string, schemaId: string) => {
        setToolPolicies(prev => 
            prev.map(policy => 
                policy._id === policyId 
                    ? {
                        ...policy,
                        policyVarsSchema: policy.policyVarsSchema.filter(schema => schema._id !== schemaId)
                    } 
                    : policy
            )
        );
    };

    const handlePolicyChange = (id: string, field: string, value: string) => {
        setToolPolicies(prev => 
            prev.map(policy => 
                policy._id === id 
                    ? { ...policy, [field]: value } 
                    : policy
            )
        );
    };

    const handleSchemaChange = (policyId: string, schemaId: string, field: string, value: string) => {
        setToolPolicies(prev => 
            prev.map(policy => 
                policy._id === policyId 
                    ? {
                        ...policy,
                        policyVarsSchema: policy.policyVarsSchema.map((schema: PolicyParamSchemaWithId) => 
                            schema._id === schemaId 
                                ? { ...schema, [field]: value } 
                                : schema
                        )
                    } 
                    : policy
            )
        );
    };

    const handleRemoveTool = (toolId: string) => {
        setToolPolicies(prev => prev.filter(tool => tool._id !== toolId));
    };

    function generateNewPolicy(): ToolPolicyWithId {
        return {
            _id: crypto.randomUUID(),
            toolIpfsCid: "",
            policyVarsSchema: [{
                _id: crypto.randomUUID(),
                paramName: "",
                valueType: "string",
                defaultValue: ""
            }]
        };
    }

    async function handleSaveToolPolicies() {
        setIsSubmitting(true);
        
        try {
            // Get the contract directly instead of using the wrapper
            const { getContract } = await import('@/services/contract/config');
            const contract = await getContract('datil', 'App', true);
            
            const toolIpfsCids = toolPolicies.map(policy => policy.toolIpfsCid || "");
            
            // Create parameter arrays needed for the contract
            const toolPolicyPolicies = toolPolicies.map(policy => 
                [policy.policyVarsSchema.map(schema => schema.defaultValue || "")]
            );
            
            // Map parameter names 
            const toolPolicyParameterNames = toolPolicies.map(policy => 
                [policy.policyVarsSchema.map(schema => schema.paramName || "")]
            );
            
            // Map parameter types from strings (e.g., "string", "bool") to their enum values
            const toolPolicyParameterTypes = toolPolicies.map(policy => 
                [policy.policyVarsSchema.map(schema => mapTypeToEnum(schema.valueType || "string"))]
            );
            
            console.log("Saving with data:", {
                toolIpfsCids,
                toolPolicyPolicies,
                toolPolicyParameterNames,
                toolPolicyParameterTypes
            });
            
            const tx = await contract.registerNextAppVersion(
                dashboard.appId,
                toolIpfsCids,
                toolPolicyPolicies,
                toolPolicyParameterNames,
                toolPolicyParameterTypes,
                {gasLimit: 5000000} // Add gas limit to avoid transaction failures
            );
            
            console.log("Transaction sent:", tx.hash);
            
            // Wait for transaction confirmation
            const receipt = await tx.wait();
            console.log("Transaction confirmed:", receipt);
            
            alert("Tool Policies saved successfully");
            
            // Return to the dashboard view automatically
            onBack();
        } catch (error: any) {
            console.error("Error saving tool policies:", error);
            let errorMessage = "Failed to save tool policies: ";
            
            if (error.message) {
                // Format error message for better readability
                errorMessage += error.message
            } else {
                errorMessage += "Unknown error";
            }
            
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }

    const renderPolicy = (tool: ToolPolicyWithId) => {
        if (!tool) return null;
        
        const policyVarsSchema = tool.policyVarsSchema || [];
        
        return (
            <div key={tool._id} className="p-4 border rounded-lg mb-4">
                <div className="flex justify-between items-start">
                    <div className="grid grid-cols-2 gap-2 flex-1 mb-4">
                        <Input
                            placeholder="Tool IPFS CID"
                            value={tool.toolIpfsCid || ""}
                            onChange={(e) => handlePolicyChange(tool._id!, "toolIpfsCid", e.target.value)}
                        />
                        <Input
                            placeholder="Description"
                            value={tool.description || ""}
                            onChange={(e) => handlePolicyChange(tool._id!, "description", e.target.value)}
                        />
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveTool(tool._id!)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-semibold">Policy Variables</h4>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => addSchema(tool._id!)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Parameter
                        </Button>
                    </div>
                    <div className="pl-4 space-y-4">
                        {policyVarsSchema.map((pVar) => (
                            <div key={pVar._id} className="flex gap-2 items-start">
                                <div className="flex-1 grid grid-cols-3 gap-2">
                                    <Input
                                        placeholder="Parameter Name"
                                        value={pVar.paramName || ""}
                                        onChange={(e) => handleSchemaChange(tool._id!, pVar._id!, "paramName", e.target.value)}
                                    />
                                    <Select
                                        value={pVar.valueType || "string"}
                                        onValueChange={(value) => handleSchemaChange(tool._id!, pVar._id!, "valueType", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="string">string</SelectItem>
                                            <SelectItem value="string[]">string[]</SelectItem>
                                            <SelectItem value="bool">bool</SelectItem>
                                            <SelectItem value="bool[]">bool[]</SelectItem>
                                            <SelectItem value="uint256">uint256</SelectItem>
                                            <SelectItem value="uint256[]">uint256[]</SelectItem>
                                            <SelectItem value="int256">int256</SelectItem>
                                            <SelectItem value="int256[]">int256[]</SelectItem>
                                            <SelectItem value="address">address</SelectItem>
                                            <SelectItem value="address[]">address[]</SelectItem>
                                            <SelectItem value="bytes">bytes</SelectItem>
                                            <SelectItem value="bytes[]">bytes[]</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        placeholder="Default Value"
                                        value={pVar.defaultValue || ""}
                                        onChange={(e) => handleSchemaChange(tool._id!, pVar._id!, "defaultValue", e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeSchema(tool._id!, pVar._id!)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        
                        {policyVarsSchema.length === 0 && (
                            <div className="text-center text-sm text-gray-500 py-2">
                                No parameters defined. Click &quot;Add Parameter&quot; to create one.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="space-y-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="text-sm text-gray-600">Loading tool policies...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold">Tool Policies</h1>
                </div>
                <Button onClick={handleAddTool} className="text-black">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tool Policy
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        Tool Policies
                        <Button variant="ghost" size="sm" className="ml-2 px-2 py-0" title="Define tools and their parameters. Each tool can have multiple parameters with different types.">
                            <Info className="h-4 w-4" />
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {toolPolicies.map((tool) => renderPolicy(tool))}

                        {toolPolicies.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                No tool policies added. Add a tool policy to get started.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSaveToolPolicies} disabled={isSubmitting} className="text-black">
                    {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </div>
    );
}