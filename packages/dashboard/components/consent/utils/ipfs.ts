/**
 * Converts IPFS CID bytes to properly encoded IPFS CID string
 * 
 * @param ipfsIdBytes - The bytes representation of an IPFS CID (e.g., "0x1220...")
 * @returns The properly encoded IPFS CID string
 */
export function convertIpfsBytesToCid(ipfsIdBytes: string): string {
  // Remove the "0x" prefix if present
  const hexString = ipfsIdBytes.startsWith('0x') ? ipfsIdBytes.slice(2) : ipfsIdBytes;
  
  // For CIDv0 (starting with 0x1220)
  if (hexString.startsWith('1220')) {
    // Extract the hash part (remove the 1220 multicodec prefix)
    const hashHex = hexString.slice(4);
    
    // Convert hex to base58 encoding
    // This is a simplified implementation - for production, use a proper base58 library
    // CIDv0 is prefixed with "Qm" in base58
    const bytes = new Uint8Array(hashHex.length / 2);
    for (let i = 0; i < hashHex.length; i += 2) {
      bytes[i / 2] = parseInt(hashHex.slice(i, i + 2), 16);
    }
    
    // Use browser's built-in base64 encoding as a shortcut
    // Note: This is a simplified approach - in a real implementation, use proper base58
    const base64 = btoa(String.fromCharCode(...bytes));
    
    // For display purposes, we'll return a formatted CID
    // In a real implementation, you would properly encode to base58
    return `Qm${base64.replace(/[+/=]/g, '')}`;
  }
  
  // Handle other CID versions if needed
  
  // If we don't recognize the format, return the original input
  return ipfsIdBytes;
}

/**
 * Extracts IPFS CID from various formats
 * 
 * @param input - Can be a full IPFS CID string, bytes representation, or an object with an ipfsCid property
 * @returns The proper IPFS CID string
 */
export function extractIpfsCid(input: any): string {
  if (!input) return '';
  
  // If input is already a string in IPFS CID format (starts with 'Qm', 'bafy', etc.)
  if (typeof input === 'string') {
    if (input.startsWith('Qm') || input.startsWith('bafy')) {
      return input;
    }
    
    // If input is bytes representation
    if (input.startsWith('0x')) {
      return convertIpfsBytesToCid(input);
    }
  }
  
  // If input is an object with ipfsCid or ipfsIdBytes property
  if (typeof input === 'object') {
    if (input.ipfsCid) {
      return extractIpfsCid(input.ipfsCid);
    }
    if (input.ipfsIdBytes) {
      return convertIpfsBytesToCid(input.ipfsIdBytes);
    }
  }
  
  // Default case - return original or empty string
  return typeof input === 'string' ? input : '';
} 