type LitNetwork = 'datil';

const REGISTRY_ADDRESSES = {
  'datil': '0xBDEd44A02b64416C831A0D82a630488A854ab4b1',
} as const;

/**
 * Gets the access control conditions for a PKP token ID.
 * These conditions check if a tool is permitted for a delegatee and if it's enabled.
 * @param tokenId - The PKP token ID to check permissions for
 * @param network - The Lit network to use (datil-dev, datil-test, or datil)
 * @returns The access control conditions array
 */
export function getAccessControlConditions(tokenId: string, network: LitNetwork): any[] {
  const contractAddress = REGISTRY_ADDRESSES[network];

  return [
    {
      contractAddress,
      functionName: "isToolPermittedForDelegatee",
      functionParams: [tokenId, ":currentActionIpfsId", ":userAddress"],
      functionAbi: {
        name: "isToolPermittedForDelegatee",
        inputs: [
          { name: "pkpTokenId", type: "uint256" },
          { name: "toolIpfsCid", type: "string" },
          { name: "delegatee", type: "address" }
        ],
        outputs: [
          { name: "isPermitted", type: "bool" },
          { name: "isEnabled", type: "bool" }
        ],
        stateMutability: "view",
        type: "function",
      },
      chain: "yellowstone",
      returnValueTest: {
        key: "isPermitted",
        comparator: "=",
        value: "true"
      }
    },
    {"operator": "and"},
    {
      contractAddress,
      functionName: "isToolPermittedForDelegatee",
      functionParams: [tokenId, ":currentActionIpfsId", ":userAddress"],
      functionAbi: {
        name: "isToolPermittedForDelegatee",
        inputs: [
          { name: "pkpTokenId", type: "uint256" },
          { name: "toolIpfsCid", type: "string" },
          { name: "delegatee", type: "address" }
        ],
        outputs: [
          { name: "isPermitted", type: "bool" },
          { name: "isEnabled", type: "bool" }
        ],
        stateMutability: "view",
        type: "function",
      },
      chain: "yellowstone",
      returnValueTest: {
        key: "isEnabled",
        comparator: "=",
        value: "true"
      }
    },
  ];
} 