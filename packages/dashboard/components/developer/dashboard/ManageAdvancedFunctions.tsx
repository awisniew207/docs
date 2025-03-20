"use client";

import { AppView } from '@/services/types';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Plus, Settings, ExternalLink, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getContract, Network, ContractFacet } from '@/services/contract/config';

interface AdvancedFunctionsProps {
  onBack: () => void;
  dashboard: AppView;
  onSuccess?: () => void;
}

export default function ManageAdvancedFunctionsScreen({
  onBack,
  dashboard,
  onSuccess,
}: AdvancedFunctionsProps) {
  // Advanced function states
  const [showAddUriDialog, setShowAddUriDialog] = useState(false);
  const [showRemoveUriDialog, setShowRemoveUriDialog] = useState(false);
  const [showEnableVersionDialog, setShowEnableVersionDialog] = useState(false);
  const [redirectUri, setRedirectUri] = useState("");
  const [versionNumber, setVersionNumber] = useState<number>(dashboard.currentVersion || 1);
  const [isVersionEnabled, setIsVersionEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    setVersionNumber(dashboard.currentVersion || 1);
  }, [dashboard]);
  
  // Redirect URI management functions
  async function handleAddRedirectUri() {
    if (!redirectUri || redirectUri.trim() === '') {
      alert("Please enter a valid redirect URI");
      return;
    }
    
    try {
      setIsProcessing(true);
      const contract = await getContract('datil' as Network, 'App' as ContractFacet, true);
      const tx = await contract.addAuthorizedRedirectUri(
        dashboard.appId, 
        redirectUri.trim(),
        {gasLimit: 5000000}
      );
      await tx.wait();
      
      alert("Redirect URI added successfully");
      setShowAddUriDialog(false);
      setRedirectUri("");
      onSuccess?.(); // Refresh app data
    } catch (error: any) {
      console.error("Error adding redirect URI:", error);
      alert(`Failed to add redirect URI: ${error.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  }
  
  async function handleRemoveRedirectUri() {
    if (!redirectUri || redirectUri.trim() === '') {
      alert("Please enter a valid redirect URI");
      return;
    }
    
    try {
      setIsProcessing(true);
      const contract = await getContract('datil' as Network, 'App' as ContractFacet, true);
      const tx = await contract.removeAuthorizedRedirectUri(
        dashboard.appId, 
        redirectUri.trim()
      );
      await tx.wait();
      
      alert("Redirect URI removed successfully");
      setShowRemoveUriDialog(false);
      setRedirectUri("");
      onSuccess?.(); // Refresh app data
    } catch (error: any) {
      console.error("Error removing redirect URI:", error);
      alert(`Failed to remove redirect URI: ${error.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  }
  
  // Version management
  async function handleEnableVersion() {
    try {
      setIsProcessing(true);
      const contract = await getContract('datil' as Network, 'App' as ContractFacet, true);
      const tx = await contract.enableAppVersion(
        dashboard.appId, 
        versionNumber,
        isVersionEnabled
      );
      await tx.wait();
      
      alert(`App version ${versionNumber} ${isVersionEnabled ? 'enabled' : 'disabled'} successfully`);
      setShowEnableVersionDialog(false);
      onSuccess?.(); // Refresh app data
    } catch (error: any) {
      console.error("Error toggling app version:", error);
      alert(`Failed to update app version: ${error.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack} className="text-black">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-black">Advanced Functions</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-black">Redirect URIs</CardTitle>
            <CardDescription className="text-black">
              Manage authorized redirect URIs for your app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                className="text-black w-full"
                onClick={() => setShowAddUriDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Redirect URI
              </Button>
              <Button 
                className="text-black w-full"
                onClick={() => setShowRemoveUriDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Redirect URI
              </Button>
            </div>
            
            <div className="p-2 border rounded-md">
              <div className="text-sm font-semibold mb-2 text-black">Current URIs:</div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {dashboard.authorizedRedirectUris && dashboard.authorizedRedirectUris.length > 0 ? (
                  dashboard.authorizedRedirectUris.map((uri, index) => (
                    <div key={index} className="flex items-center text-xs p-2 bg-muted rounded-sm">
                      <ExternalLink className="h-3 w-3 mr-2 text-muted-foreground" />
                      <span className="truncate text-black">{uri}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground p-2">No redirect URIs configured</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-black">Version Management</CardTitle>
            <CardDescription className="text-black">
              Enable or disable specific app versions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="text-black w-full"
              onClick={() => setShowEnableVersionDialog(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Enable/Disable Version
            </Button>
            
            <div className="p-2 border rounded-md">
              <div className="text-sm font-semibold mb-2 text-black">App Details:</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">App ID:</div>
                <div className="font-mono text-black">{dashboard.appId}</div>
                <div className="text-muted-foreground">Current Version:</div>
                <div className="font-mono text-black">{dashboard.currentVersion}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Dialogs */}
      <Dialog open={showAddUriDialog} onOpenChange={setShowAddUriDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Redirect URI</DialogTitle>
            <DialogDescription>
              Enter the redirect URI you want to authorize for this app.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="redirectUri" className="text-sm font-medium">
                Redirect URI
              </label>
              <Input
                id="redirectUri"
                placeholder="https://..."
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddUriDialog(false);
                  setRedirectUri("");
                }}
                className="text-black"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddRedirectUri}
                disabled={isProcessing}
                className="text-black"
              >
                {isProcessing ? "Adding..." : "Add URI"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showRemoveUriDialog} onOpenChange={setShowRemoveUriDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Redirect URI</DialogTitle>
            <DialogDescription>
              Enter the redirect URI you want to remove from this app.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="redirectUriRemove" className="text-sm font-medium">
                Redirect URI
              </label>
              <Input
                id="redirectUriRemove"
                placeholder="https://..."
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRemoveUriDialog(false);
                  setRedirectUri("");
                }}
                className="text-black"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRemoveRedirectUri}
                disabled={isProcessing}
                className="text-black"
                variant="destructive"
              >
                {isProcessing ? "Removing..." : "Remove URI"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showEnableVersionDialog} onOpenChange={setShowEnableVersionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enable/Disable App Version</DialogTitle>
            <DialogDescription>
              Specify the version number and whether to enable or disable it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="versionNumber" className="text-sm font-medium">
                Version Number
              </label>
              <Input
                id="versionNumber"
                type="number"
                min="1"
                value={versionNumber}
                onChange={(e) => setVersionNumber(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="versionEnabled" 
                checked={isVersionEnabled}
                onChange={(e) => setIsVersionEnabled(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="versionEnabled" className="text-sm font-medium">
                Enable Version
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEnableVersionDialog(false);
                }}
                className="text-black"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEnableVersion}
                disabled={isProcessing}
                className="text-black"
              >
                {isProcessing ? "Processing..." : "Update Version"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 