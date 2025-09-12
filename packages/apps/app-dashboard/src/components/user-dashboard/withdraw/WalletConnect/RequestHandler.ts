import { IWalletKit } from '@reown/walletkit';

// Store for pending session requests
let pendingSessionRequests: any[] = [];

/**
 * Get the current pending session requests
 * @returns Array of pending session requests
 */
export function getPendingSessionRequests(): any[] {
  return [...pendingSessionRequests];
}

/**
 * Clear a session request from the pending requests list
 * @param id The ID of the request to clear
 */
export function clearSessionRequest(id: number): void {
  pendingSessionRequests = pendingSessionRequests.filter((req) => req.id !== id);
}

/**
 * Setup request handlers for the WalletKit client
 * This allows the client to handle requests from dApps
 * @param client The WalletKit client
 */
export function setupRequestHandlers(client: IWalletKit): void {
  // Log session events for debugging
  client.on('session_request', async (event: any) => {
    // Check if request already exists to prevent duplicates
    const existingRequest = pendingSessionRequests.find((req) => req.id === event.id);
    if (existingRequest) {
      console.log('Request already exists, skipping duplicate:', event.id);
      return;
    }

    const { params } = event;
    const { request } = params;
    const { method } = request;

    // Auto-approve safe methods immediately
    if (method === 'wallet_getCapabilities') {
      console.log('Auto-approving wallet_getCapabilities request');
      try {
        const result = getWalletCapabilities();
        const response = { id: event.id, jsonrpc: '2.0', result };
        await client.respondSessionRequest({ topic: event.topic, response });
        console.log('Successfully auto-approved wallet_getCapabilities');
        return;
      } catch (error) {
        console.error('Failed to auto-approve wallet_getCapabilities:', error);
        // Fall through to add to pending requests if auto-approval fails
      }
    }

    // Add to pending requests for user approval
    pendingSessionRequests.push(event);
    const customEvent = new CustomEvent('walletconnect:session_request', {
      detail: event,
    });
    window.dispatchEvent(customEvent);
  });

  client.on('session_proposal', (event: any) => {
    console.log('Received session proposal:', event);
  });

  client.on('session_delete', (event: any) => {
    console.log('Session deleted:', event);
  });

  window.addEventListener('walletconnect:transaction_complete', (event: Event) => {
    const customEvent = event as CustomEvent;
    console.log('Transaction complete event received:', customEvent.detail);

    notifyTransactionComplete(client, customEvent.detail);
  });

  window.addEventListener('walletconnect:transaction_error', (event: Event) => {
    const customEvent = event as CustomEvent;
    console.log('Transaction error event received:', customEvent.detail);

    notifyTransactionError(client, customEvent.detail);
  });

  console.log('WalletKit request handlers setup completed');
}

/**
 * Get wallet capabilities for auto-approval
 */
function getWalletCapabilities() {
  return {
    accountProperties: [
      'signTransaction',
      'signMessage',
      'signTypedData',
      'signTypedDataLegacy',
      'signTypedDataV3',
      'signTypedDataV4',
    ],
    chainProperties: ['transactionHistory'],
    walletProperties: ['supportsAddingNetwork', 'supportsSwitchingNetwork'],
  };
}

/**
 * Notify the dApp that a transaction has completed successfully
 */
function notifyTransactionComplete(client: IWalletKit, detail: any): void {
  const { topic, id, result } = detail;

  if (!topic || id === undefined) {
    console.error('Cannot notify transaction complete: missing topic or id');
    return;
  }

  console.log(`Notifying dApp of completed transaction: ${id} on topic ${topic}`);

  // Send the response to the dApp
  client
    .respondSessionRequest({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        result,
      },
    })
    .then(() => {
      console.log(`Successfully responded to request ${id}`);
    })
    .catch((error) => {
      console.error(`Error responding to request ${id}:`, error);
    });
}

/**
 * Notify the dApp that a transaction has failed
 */
function notifyTransactionError(client: IWalletKit, detail: any): void {
  const { topic, id, error } = detail;

  if (!topic || id === undefined) {
    console.error('Cannot notify transaction error: missing topic or id');
    return;
  }

  console.log(`Notifying dApp of transaction error: ${id} on topic ${topic}`);

  // Send the error response to the dApp
  client
    .respondSessionRequest({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        error: {
          code: 4001,
          message: error || 'Transaction failed',
        },
      },
    })
    .then(() => {
      console.log(`Successfully responded with error to request ${id}`);
    })
    .catch((errorResp) => {
      console.error(`Error responding with error to request ${id}:`, errorResp);
    });
}
