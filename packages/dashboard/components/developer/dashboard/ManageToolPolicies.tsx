"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { AppView } from "@/services/types";
import { VincentContracts } from "@/services";

// Define the types explicitly since they're not exported from services/types
interface ToolPolicy {
    toolIpfsCid?: string;
    policyVarsSchema?: Array<PolicyParamSchema>;
    [key: string]: any; // To allow other properties
}

interface PolicyParamSchema {
    paramName?: string;
    defaultValue?: string;
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
    const [toolPolicies, setToolPolicies] = useState<ToolPolicyWithId[]>(
        (dashboard.toolPolicies || []).map((policy: any) => ({
            ...policy,
            _id: crypto.randomUUID(),
            policyVarsSchema: policy.policyVarsSchema 
                ? policy.policyVarsSchema.map((schema: any) => ({
                    ...schema,
                    _id: crypto.randomUUID()
                })) 
                : []
        }))
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (dashboard && dashboard.toolPolicies) {
            setToolPolicies((dashboard.toolPolicies || []).map(policy => ({
                ...policy,
                _id: crypto.randomUUID(),
                policyVarsSchema: policy.policyVarsSchema 
                    ? policy.policyVarsSchema.map((schema: any) => ({
                        ...schema,
                        _id: crypto.randomUUID()
                    }))
                    : []
            })));
        }
    }, [dashboard, dashboard.toolPolicies]);

    const handleAddTool = () => {
        const newTool: ToolPolicyWithId = {
            _id: crypto.randomUUID(),
            toolIpfsCid: "",
            description: "",
            policyVarsSchema: [{
                _id: crypto.randomUUID(),
                paramName: "",
                valueType: "",
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
            const paramNames = toolPolicies.map(policy => 
                policy.policyVarsSchema.map(schema => [(schema.paramName || "")])
            );
            const defaultValues = toolPolicies.map(policy => 
                policy.policyVarsSchema.map(schema => (schema.defaultValue || ""))
            );
            // Add the missing parameter - schema IPFS CIDs (empty arrays if not present)
            const toolPolicySchemaIpfsCids = toolPolicies.map(policy => 
                policy.policyVarsSchema.map(() => "")  // Empty string for each schema
            );
            
            const tx = await contract.registerNextAppVersion(
                dashboard.appId,
                toolIpfsCids.filter(cid => typeof cid === 'string'),
                defaultValues,
                toolPolicySchemaIpfsCids,
                paramNames,
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
                errorMessage += error.message.split('(')[0].trim();
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
                                    <Input
                                        placeholder="Value Type"
                                        value={pVar.valueType || ""}
                                        onChange={(e) => handleSchemaChange(tool._id!, pVar._id!, "valueType", e.target.value)}
                                    />
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
                    </div>
                </div>
            </div>
        );
    };

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
                    <CardTitle>Tool Policies</CardTitle>
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