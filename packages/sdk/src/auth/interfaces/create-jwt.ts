import { PKPEthersWallet } from "@lit-protocol/pkp-ethers";
import { IRelayPKP } from "@lit-protocol/types";
/**
 * Configuration interface for creating a JWT (JSON Web Token) signed by a PKP wallet.
 * 
 * This interface defines all required parameters for the JWT creation process:
 *
 * @interface createJWTConfig
 * @property {PKPEthersWallet} pkpWallet - The PKP Ethers wallet instance used for signing the JWT
 * @property {IRelayPKP} pkp - The PKP object
 * @property {Record<string, any>} payload - Custom claims to include in the JWT payload
 * @property {number} expiresInMinutes - Token expiration time in minutes from current time
 * @property {string} audience - The domain(s) this token is intended for (aud claim)
 */
export interface createJWTConfig {
    pkpWallet: PKPEthersWallet,
    pkp: IRelayPKP,
    payload: Record<string, any>,
    expiresInMinutes: number,
    audience: string
}