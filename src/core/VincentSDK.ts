import { SessionSigs } from "../pkp";
import { createPKPSigner, createPKPSignedJWT, verifyJWTSignature } from "../auth";
import { IStorage, Storage } from "../auth";
import { LIT_NETWORKS_KEYS } from '@lit-protocol/types';
import { ethers } from 'ethers';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';

export interface VincentSDKConfig {
  storage?: IStorage;
  consentPageUrl?: string;
  network?: LIT_NETWORKS_KEYS;
}

export class VincentSDK {
  private storage: Storage;
  private consentPageUrl: string;
  private network: LIT_NETWORKS_KEYS;

  constructor(config: VincentSDKConfig = {}) {
    // Initialize storage using Storage class which handles environment detection
    this.storage = new Storage(config.storage);
    this.consentPageUrl = config.consentPageUrl || 'https://consent.vincent.com';
    this.network = config.network || 'datil';
  }

  // JWT Management
  async createSigner(pkpWallet: PKPEthersWallet): Promise<any> {
    return createPKPSigner(pkpWallet);
  }

  async createSignedJWT(pkpWallet: PKPEthersWallet, pkp: any, payload: Record<string, any>, expiresInMinutes: number = 10, audience: string | string[]): Promise<string> {
    return createPKPSignedJWT(pkpWallet, pkp, payload, expiresInMinutes, audience);
  }

  async verifyJWT(jwt: string, publicKey: string): Promise<boolean> {
    return verifyJWTSignature(jwt, publicKey);
  }

  // Storage Management
  async storeJWT(jwt: string): Promise<void> {
    await this.storage.storeJWT(jwt);
  }

  async getJWT(): Promise<string | null> {
    return this.storage.getJWT();
  }

  async clearJWT(): Promise<void> {
    await this.storage.clearJWT();
  }

  // Agent PKP Management
  async getDelegatedAgentPKPs(): Promise<Array<{ publicKey: string; ethAddress: string }>> {
    const pkps = await fetch(`${this.consentPageUrl}/api/pkps`).then(res => res.json());
    return pkps;
  }

  async setDelegatee(walletAddress: string): Promise<void> {
    await fetch(`${this.consentPageUrl}/api/delegate`, {
      method: 'POST',
      body: JSON.stringify({ walletAddress })
    });
  }

  async updateDelegatee(walletAddress: string): Promise<void> {
    await fetch(`${this.consentPageUrl}/api/delegate`, {
      method: 'PUT',
      body: JSON.stringify({ walletAddress })
    });
  }

  // Session Signatures
  async invokeLitAction(signer: ethers.Signer) {
    const sessionSigs = new SessionSigs(this.network);
    return sessionSigs.invokeLitAction(signer);
  }

  // Consent Page Management
  openSignInConsentPage(): void {
    const url = new URL('/signin', this.consentPageUrl);
    window.open(url.toString(), '_blank');
  }

  openDelegationConsentPage(): void {
    const url = new URL('/delegate', this.consentPageUrl);
    window.open(url.toString(), '_blank');
  }
} 