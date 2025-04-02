"use client";

import { AppView } from '@/services/types';
import { useState, useEffect, useCallback } from 'react';
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
import { Network, ContractFacet } from '@/services/contract/config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useErrorPopup } from '@/providers/error-popup';

interface AdvancedFunctionsProps {
  onBack: () => void;
  dashboard: AppView;
  onSuccess?: () => void;
}

// Status message component
const StatusMessage = ({ message, type = 'info' }: { message: string, type?: 'info' | 'warning' | 'success' | 'error' }) => {
  if (!message) return null;
  
  const getStatusClass = () => {
    switch (type) {
      case 'warning': return 'status-message--warning';
      case 'success': return 'status-message--success';
      case 'error': return 'status-message--error';
      default: return 'status-message--info';
    }
  };
  
  return (
    <div className={`status-message ${getStatusClass()}`}>
      {type === 'info' && <div className="spinner"></div>}
      <span>{message}</span>
    </div>
  );
};

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
  const [availableVersions, setAvailableVersions] = useState<{version: number, enabled: boolean}[]>([]);
  
  // Add status message state
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
  
  // Add the error popup hook
  const { showError } = useErrorPopup();
  
  // Helper function to set status messages
  const showStatus = useCallback((message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
  }, []);
  
  // Clear status message
  const clearStatus = useCallback(() => {
    setStatusMessage('');
  }, []);
  
  // Create enhanced error function that shows both popup and status error
  const showErrorWithStatus = useCallback((errorMessage: string, title?: string, details?: string) => {
    // Show error in popup
    showError(errorMessage, title || 'Error', details);
    // Also show in status message
    showStatus(errorMessage, 'error');
  }, [showError, showStatus]);
  
  useEffect(() => {
    setVersionNumber(dashboard.currentVersion || 1);
    
    // Extract available versions
    const versions = (dashboard.toolPolicies || []).map(versionData => {
      const version = versionData.version || versionData[0];
      const enabled = versionData.enabled !== undefined ? versionData.enabled : versionData[1];
      return { version: parseInt(version.toString()), enabled };
    });
    
    setAvailableVersions(versions);
  }, [dashboard]);
  
  // Redirect URI management functions
  async function handleAddRedirectUri() {
    if (!redirectUri || redirectUri.trim() === '') {
      showErrorWithStatus("Please enter a valid redirect URI", "Invalid URI");
      return;
    }
    
    try {
      setIsProcessing(true);
      showStatus("Adding redirect URI...", "info");
      const { getContract, estimateGasWithBuffer } = await import('@/services/contract/config');
      const contract = await getContract('datil' as Network, 'App' as ContractFacet, true);
      
      // Create args array for gas estimation
      const args = [dashboard.appId, redirectUri.trim()];
      
      // Estimate gas with buffer
      showStatus("Estimating gas...", "info");
      const gasLimit = await estimateGasWithBuffer(
        contract,
        'addAuthorizedRedirectUri',
        args
      );
      
      showStatus("Sending transaction...", "info");
      const tx = await contract.addAuthorizedRedirectUri(
        ...args,
        {gasLimit}
      );
      
      showStatus("Waiting for confirmation...", "info");
      await tx.wait();
      
      showStatus("Redirect URI added successfully", "success");
      setShowAddUriDialog(false);
      setRedirectUri("");
      
      // Refresh app data after a delay
      setTimeout(() => {
        clearStatus();
        onSuccess?.();
      }, 2000);
    } catch (error: any) {
      console.error("Error adding redirect URI:", error);
      showErrorWithStatus(`Failed to add redirect URI: ${error.message || "Unknown error"}`, "Transaction Error");
    } finally {
      setIsProcessing(false);
    }
  }
  
  async function handleRemoveRedirectUri() {
    if (!redirectUri || redirectUri.trim() === '') {
      showErrorWithStatus("Please enter a valid redirect URI", "Invalid URI");
      return;
    }
    
    try {
      setIsProcessing(true);
      showStatus("Removing redirect URI...", "info");
      const { getContract, estimateGasWithBuffer } = await import('@/services/contract/config');
      const contract = await getContract('datil' as Network, 'App' as ContractFacet, true);
      
      // Create args array for gas estimation
      const args = [dashboard.appId, redirectUri.trim()];
      
      // Estimate gas with buffer
      showStatus("Estimating gas...", "info");
      const gasLimit = await estimateGasWithBuffer(
        contract,
        'removeAuthorizedRedirectUri',
        args
      );
      
      showStatus("Sending transaction...", "info");
      const tx = await contract.removeAuthorizedRedirectUri(
        ...args,
        {gasLimit}
      );
      
      showStatus("Waiting for confirmation...", "info");
      await tx.wait();
      
      showStatus("Redirect URI removed successfully", "success");
      setShowRemoveUriDialog(false);
      setRedirectUri("");
      
      // Refresh app data after a delay
      setTimeout(() => {
        clearStatus();
        onSuccess?.();
      }, 2000);
    } catch (error: any) {
      console.error("Error removing redirect URI:", error);
      showErrorWithStatus(`Failed to remove redirect URI: ${error.message || "Unknown error"}`, "Transaction Error");
    } finally {
      setIsProcessing(false);
    }
  }
  
  // Version management
  async function handleToggleVersion() {
    try {
      setIsProcessing(true);
      showStatus(`${isVersionEnabled ? 'Disabling' : 'Enabling'} version ${versionNumber}...`, "info");
      const { getContract, estimateGasWithBuffer } = await import('@/services/contract/config');
      const contract = await getContract('datil' as Network, 'App' as ContractFacet, true);
      
      // Enable or disable the selected version
      console.log(`${isVersionEnabled ? 'Disabling' : 'Enabling'} version ${versionNumber}`);
      
      // Create args array for gas estimation
      const args = [
        dashboard.appId,
        versionNumber,
        !isVersionEnabled // Toggle the current status
      ];
      
      // Estimate gas with buffer
      showStatus("Estimating gas...", "info");
      const gasLimit = await estimateGasWithBuffer(
        contract,
        'enableAppVersion',
        args
      );
      
      showStatus("Sending transaction...", "info");
      const tx = await contract.enableAppVersion(
        ...args,
        {gasLimit}
      );
      
      showStatus("Waiting for confirmation...", "info");
      await tx.wait();
      
      showStatus(`Version ${versionNumber} ${isVersionEnabled ? 'disabled' : 'enabled'} successfully`, "success");
      setShowEnableVersionDialog(false);
      
      // Refresh app data after a delay
      setTimeout(() => {
        clearStatus();
        onSuccess?.();
      }, 2000);
    } catch (error: any) {
      console.error("Error toggling version:", error);
      showErrorWithStatus(`Failed to ${isVersionEnabled ? 'disable' : 'enable'} version: ${error.message || "Unknown error"}`, "Transaction Error");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Display status message */}
      {statusMessage && <StatusMessage message={statusMessage} type={statusType} />}
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="p-0 text-black"
          >
            <ArrowLeft className="h-4 w-4" />
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
              onClick={() => {
                if ((dashboard.toolPolicies || []).length === 0) {
                  alert("No app versions available. Create an app version first.");
                  return;
                }
                setShowEnableVersionDialog(true);
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Versions
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
            <DialogTitle>{isVersionEnabled ? "Disable" : "Enable"} App Version</DialogTitle>
            <DialogDescription>
              {isVersionEnabled 
                ? "Disable this version. This will prevent it from being used."
                : "Enable this version. This will allow it to be used."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="versionNumber" className="text-sm font-medium">
                Version Number
              </label>
              <Select 
                value={versionNumber.toString()} 
                onValueChange={(value) => {
                  const versionNum = parseInt(value);
                  setVersionNumber(versionNum);
                  // Update isVersionEnabled based on the selected version
                  const selectedVersion = availableVersions.find(v => v.version === versionNum);
                  setIsVersionEnabled(selectedVersion?.enabled || false);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={availableVersions.length > 0 ? "Select version" : "No versions available"} />
                </SelectTrigger>
                <SelectContent>
                  {availableVersions.length > 0 ? (
                    availableVersions.map((versionData, index) => (
                      <SelectItem key={index} value={versionData.version.toString()}>
                        Version {versionData.version.toString()} {versionData.enabled ? "(Currently Enabled)" : ""}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No versions available</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Multiple versions can be enabled simultaneously. Enable the versions you want to use.
              </p>
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
                onClick={handleToggleVersion}
                disabled={isProcessing}
                className="text-black"
              >
                {isProcessing ? "Updating..." : isVersionEnabled ? "Disable Version" : "Enable Version"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 