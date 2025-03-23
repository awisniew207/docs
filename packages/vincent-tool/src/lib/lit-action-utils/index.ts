declare global {
  // Injected By Lit
  const Lit: any;
  const LitAuth: any;

  // Injected by build script
  const LIT_NETWORK: string;
  const VINCENT_ADDRESS: string;

  const ethers: {
    providers: {
      JsonRpcProvider: any;
    };
    utils: {
      Interface: any;
      parseUnits: any;
      formatUnits: any;
      formatEther: any;
      arrayify: any;
      keccak256: any;
      serializeTransaction: any;
      joinSignature: any;
      isHexString: any;
      getAddress: any;
      defaultAbiCoder: any;
      toUtf8Bytes: any;
      toUtf8String: any;
    };
    BigNumber: any;
    Contract: any;
  };
}

export * from './get-pkp-info';
export * from './get-vincent-contract';
export * from './network-config';