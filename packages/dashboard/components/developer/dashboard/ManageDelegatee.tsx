"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Wallet } from "ethers";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { AppView } from "@/services/types";
import { VincentContracts } from "@/services";
import { Input } from "@/components/ui/input";

interface DelegateeManagerProps {
    onBack: () => void;
    dashboard: AppView;
}

export default function DelegateeManagerScreen({
    onBack,
    dashboard,
}: DelegateeManagerProps) {
    const [delegatees, setDelegatees] = useState<string[]>(
        dashboard.delegatees || []
    );
    const [showKeyDialog, setShowKeyDialog] = useState(false);
    const [newPrivateKey, setNewPrivateKey] = useState("");
    const [newAddress, setNewAddress] = useState("");
    const [copying, setCopying] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [manualAddress, setManualAddress] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        setDelegatees(dashboard.delegatees || []);
    }, [dashboard.delegatees]);

    const handleGenerateDelegatee = () => {
        const wallet = Wallet.createRandom();
        setNewPrivateKey(wallet.privateKey);
        setNewAddress(wallet.address);
        setShowKeyDialog(true);
    };

    const handleCopyPrivateKey = async () => {
        try {
            await navigator.clipboard.writeText(newPrivateKey);
            setCopying(true);
            setTimeout(() => setCopying(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            alert('Failed to copy to clipboard');
        }
    };

    async function handleConfirmSaved() {
        try {
            setIsSaving(true);
            const contracts = new VincentContracts('datil');
            
            console.log("Adding generated delegatee to app ID:", dashboard.appId);
            console.log("Delegatee address:", newAddress);
            
            // Add the delegatee using addDelegatee
            const tx = await contracts.addDelegatee(dashboard.appId, newAddress);
            console.log("Transaction sent:", tx.hash);
            
            // Wait for transaction confirmation
            const receipt = await tx.wait();
            console.log("Transaction confirmed:", receipt);
            
            // Update the UI
            setDelegatees((prev) => [...prev, newAddress]);
            setShowKeyDialog(false);
            setNewPrivateKey("");
            setNewAddress("");
            
            alert("Delegatee added successfully!");
            
            // Notify parent to refresh
            onBack();
        } catch (error: any) {
            console.error("Error adding generated delegatee:", error);
            
            let errorMessage = "Failed to add delegatee. ";
            if (error.message) {
                if (error.message.includes("CALL_EXCEPTION")) {
                    errorMessage += "Transaction was rejected by the contract. You might not have permission to add delegatees for this app.";
                } else if (error.message.includes("user rejected")) {
                    errorMessage = "Transaction was rejected by the user.";
                } else {
                    errorMessage += error.message.split('(')[0];
                }
            }
            
            alert(errorMessage);
            // Keep the dialog open so user can copy the private key even if adding fails
        } finally {
            setIsSaving(false);
        }
    }

    async function handleAddDelegatee() {
        if (!manualAddress || !manualAddress.startsWith('0x') || manualAddress.length !== 42) {
            alert("Please enter a valid Ethereum address");
            return;
        }

        try {
            setIsAdding(true);
            const contracts = new VincentContracts('datil');
            
            try {
                // Check if the delegatee is already added
                if (delegatees.includes(manualAddress)) {
                    alert("This address is already a delegatee for this app");
                    setIsAdding(false);
                    return;
                }
                
                // First verify that we can access the app data
                try {
                    const appData = await contracts.getAppById(dashboard.appId);
                    console.log("App data fetched:", appData);
                    
                    // Ensure the app exists and we have the correct ID
                    if (!appData || !appData.id) {
                        alert(`App ID ${dashboard.appId} not found or not accessible`);
                        setIsAdding(false);
                        return;
                    }
                } catch (appError) {
                    console.error("Error verifying app:", appError);
                    alert(`Could not verify app ID ${dashboard.appId}. Please check your connection and permissions.`);
                    setIsAdding(false);
                    return;
                }
                
                console.log("Adding delegatee to app ID:", dashboard.appId);
                console.log("Delegatee address:", manualAddress);
                
                // Attempt to add the delegatee with explicit gas settings
                // Use the app manager's wallet or ensure we're connected with the right wallet
                const tx = await contracts.addDelegatee(dashboard.appId, manualAddress);
                console.log("Transaction sent:", tx.hash);
                
                // Wait for the transaction
                const receipt = await tx.wait();
                console.log("Transaction confirmed:", receipt);
                
                // Update UI
                setDelegatees((prev) => [...prev, manualAddress]);
                setShowAddDialog(false);
                setManualAddress("");
                alert("Delegatee added successfully!");
                
                // Notify parent to refresh
                onBack();
            } catch (innerError: any) {
                console.error("Detailed error:", innerError);
                let errorMessage = "Failed to add delegatee. ";
                
                // Extract the most useful part of the error message
                if (innerError.message) {
                    // Check for common error patterns
                    if (innerError.message.includes("CALL_EXCEPTION")) {
                        errorMessage += "Transaction was rejected by the contract. You might not have permission to add delegatees for this app.";
                    } else if (innerError.message.includes("user rejected")) {
                        errorMessage = "Transaction was rejected by the user.";
                    } else {
                        errorMessage += innerError.message.split('(')[0]; // Get first part of error
                    }
                }
                
                alert(errorMessage);
            }
        } catch (error: any) {
            console.error("Error adding delegatee:", error);
            alert(`Failed to add delegatee: ${error.message || "Unknown error"}`);
        } finally {
            setIsAdding(false);
        }
    }

    // Function to remove a delegatee
    async function handleRemoveDelegatee(delegateeAddress: string) {
        if (!confirm(`Are you sure you want to remove ${delegateeAddress} from delegatees?`)) {
            return;
        }
        
        try {
            const contracts = new VincentContracts('datil');
            const tx = await contracts.removeDelegatee(dashboard.appId, delegateeAddress);
            await tx.wait();
            
            // Update UI
            setDelegatees(prev => prev.filter(addr => addr !== delegateeAddress));
            alert("Delegatee removed successfully");
            
            // Notify parent to refresh
            onBack();
        } catch (error: any) {
            console.error("Error removing delegatee:", error);
            alert(`Failed to remove delegatee: ${error.message || "Unknown error"}`);
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="default" size="sm" onClick={onBack} className="text-black">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold">Delegatees</h1>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setShowAddDialog(true)} className="text-black">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Delegatee
                    </Button>
                    <Button onClick={handleGenerateDelegatee} className="text-black">
                        <Plus className="h-4 w-4 mr-2" />
                        Generate Delegatee
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Delegatee Addresses</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {delegatees.map((address) => (
                            <div
                                key={address}
                                className="flex justify-between items-center p-4 border rounded-lg"
                            >
                                <div className="font-mono text-sm break-all">
                                    {address}
                                </div>
                                <Button 
                                    variant="destructive" 
                                    size="sm"
                                    className="text-black"
                                    onClick={() => handleRemoveDelegatee(address)}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                        {delegatees.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                No delegatees found. Create one to get started.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Delegatee</DialogTitle>
                        <DialogDescription>
                            Enter the Ethereum address of the delegatee you want to add.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="delegateeAddress" className="text-sm font-medium">
                                Delegatee Address
                            </label>
                            <Input
                                id="delegateeAddress"
                                placeholder="0x..."
                                value={manualAddress}
                                onChange={(e) => setManualAddress(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowAddDialog(false);
                                    setManualAddress("");
                                }}
                                className="text-black"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleAddDelegatee}
                                disabled={isAdding}
                                className="text-black"
                            >
                                {isAdding ? "Adding..." : "Add Delegatee"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Save Private Key</DialogTitle>
                        <DialogDescription>
                            WARNING: Save this private key securely. It will
                            never be shown again!
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="text-sm text-muted-foreground mb-2">
                            Eth Address:{" "}
                            <span className="font-mono">{newAddress}</span>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="font-mono text-sm break-all">
                                <div className="text-muted-foreground mb-1">
                                    Private Key:
                                </div>
                                {newPrivateKey}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                className="flex-1 text-black"
                                onClick={handleCopyPrivateKey}
                                disabled={copying}
                            >
                                {copying ? (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Private Key
                                    </>
                                )}
                            </Button>
                        </div>
                        <div className="border-t pt-4">
                            <Button
                                className="w-full text-black"
                                variant="default"
                                onClick={handleConfirmSaved}
                                disabled={isSaving}
                            >
                                {isSaving ? "Adding Delegatee..." : "I have saved the private key"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
