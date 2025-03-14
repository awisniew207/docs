/**
 * Interface representing a decoded JWT
 *
 * This interface defines the structure of a decoded JWT, including the header, payload, and signature
 *
 * @interface DecodedJWT
 * @property {Object} header - The header of the JWT
 * @property {Object} payload - The payload of the JWT
 * @property {string} signature - The signature of the JWT
 */
export interface DecodedJWT {
  header: {
    typ?: string;
    alg: string;
    [key: string]: unknown;
  };
  payload: {
    iss?: string;
    sub?: string;
    aud?: string | string[];
    iat?: number;
    exp?: number;
    nbf?: number;
    [key: string]: unknown;
  };
  signature: string;
}
