import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { createViemAccount } from './createViemAccount';

describe('createViemAccount', () => {
  let pkpPubKey: string;
  let litNodeClient: LitNodeClient;
  let controllerSessionSigs = {
    'https://173.208.0.159:443': {
      sig: 'fd578b01cb6b4d7913abeb4fbb0b0bdfbee13f89a4387ed11ae507988bb396b4c2add3d9b743e53eebcb7332457a692f69c36d24a8ff84938a7a4d71d0a7860b',
      derivedVia: 'litSessionSignViaNacl',
      signedMessage: `{"sessionKey":"675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4","resourceAbilityRequests":[{"resource":{"resource":"*","resourcePrefix":"lit-pkp"},"ability":"pkp-signing"},{"resource":{"resource":"*","resourcePrefix":"lit-litaction"},"ability":"lit-action-execution"}],"capabilities":[{"sig":"0x1e8a313ba62ff4d3234d0bcc0e17745295e386d6138d819e55ac72177e6431636962678c928bc0e00d21b001f6540342c4876cc17ca75ee467387f540ae295471c","derivedVia":"web3.eth.personal.sign","signedMessage":"localhost wants you to sign in with your Ethereum account:\\n0xEa48EFee5007D427e85579135a8201b8971a0058\\n\\nThis is a test statement.  You can put anything you want here. I further authorize the stated URI to perform the following actions on my behalf: (1) 'Auth': 'Auth' for 'lit-ratelimitincrease://151889'.\\n\\nURI: lit:capability:delegation\\nVersion: 1\\nChain ID: 1\\nNonce: 0xb98fdd4c2ca6b647764180f3e6c08d33327232a670d2c955d244316b4e2f15e9\\nIssued At: 2025-03-25T01:21:56.236Z\\nExpiration Time: 2025-04-01T01:21:56.232Z\\nResources:\\n- urn:recap:eyJhdHQiOnsibGl0LXJhdGVsaW1pdGluY3JlYXNlOi8vMTUxODg5Ijp7IkF1dGgvQXV0aCI6W3sibmZ0X2lkIjpbIjE1MTg4OSJdLCJ1c2VzIjoiMjAwIn1dfX0sInByZiI6W119","address":"0xEa48EFee5007D427e85579135a8201b8971a0058"},{"sig":"0xcaad11f04c92ce9115dc826b8bca14b1c00b1279d64f1bee316077ebc50885bc39a9fed8a92b68c244bf0129cb9a8ea1affc9a1b42b805424b8bbab8d379d83f1c","derivedVia":"web3.eth.personal.sign","signedMessage":"localhost wants you to sign in with your Ethereum account:\\n0x25Da42DBB1a41eEb8D1Ec3d8cEa4545BBea0D949\\n\\nThis is a test statement.  You can put anything you want here. I further authorize the stated URI to perform the following actions on my behalf: (1) 'Threshold': 'Execution' for 'lit-litaction://*'. (2) 'Threshold': 'Signing' for 'lit-pkp://*'.\\n\\nURI: lit:session:675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4\\nVersion: 1\\nChain ID: 1\\nNonce: 0xb98fdd4c2ca6b647764180f3e6c08d33327232a670d2c955d244316b4e2f15e9\\nIssued At: 2025-03-25T01:21:59.366Z\\nExpiration Time: 2025-03-26T01:21:59.364Z\\nResources:\\n- urn:recap:eyJhdHQiOnsibGl0LWxpdGFjdGlvbjovLyoiOnsiVGhyZXNob2xkL0V4ZWN1dGlvbiI6W3t9XX0sImxpdC1wa3A6Ly8qIjp7IlRocmVzaG9sZC9TaWduaW5nIjpbe31dfX0sInByZiI6W119","address":"0x25Da42DBB1a41eEb8D1Ec3d8cEa4545BBea0D949"}],"issuedAt":"2025-03-25T01:21:59.395Z","expiration":"2025-03-26T01:21:59.364Z","nodeAddress":"https://173.208.0.159:443"}`,
      address:
        '675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4',
      algo: 'ed25519',
    },
    'https://184.107.182.142:443': {
      sig: '304e99a3d3db9f692e18652f14577c2b34b30e51f3748f8f644a1949e5ed82a030121678a70c1d6f5da9d84745ec7928066d29d87ed91c9c6df678f5cd304406',
      derivedVia: 'litSessionSignViaNacl',
      signedMessage: `{"sessionKey":"675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4","resourceAbilityRequests":[{"resource":{"resource":"*","resourcePrefix":"lit-pkp"},"ability":"pkp-signing"},{"resource":{"resource":"*","resourcePrefix":"lit-litaction"},"ability":"lit-action-execution"}],"capabilities":[{"sig":"0x1e8a313ba62ff4d3234d0bcc0e17745295e386d6138d819e55ac72177e6431636962678c928bc0e00d21b001f6540342c4876cc17ca75ee467387f540ae295471c","derivedVia":"web3.eth.personal.sign","signedMessage":"localhost wants you to sign in with your Ethereum account:\\n0xEa48EFee5007D427e85579135a8201b8971a0058\\n\\nThis is a test statement.  You can put anything you want here. I further authorize the stated URI to perform the following actions on my behalf: (1) 'Auth': 'Auth' for 'lit-ratelimitincrease://151889'.\\n\\nURI: lit:capability:delegation\\nVersion: 1\\nChain ID: 1\\nNonce: 0xb98fdd4c2ca6b647764180f3e6c08d33327232a670d2c955d244316b4e2f15e9\\nIssued At: 2025-03-25T01:21:56.236Z\\nExpiration Time: 2025-04-01T01:21:56.232Z\\nResources:\\n- urn:recap:eyJhdHQiOnsibGl0LXJhdGVsaW1pdGluY3JlYXNlOi8vMTUxODg5Ijp7IkF1dGgvQXV0aCI6W3sibmZ0X2lkIjpbIjE1MTg4OSJdLCJ1c2VzIjoiMjAwIn1dfX0sInByZiI6W119","address":"0xEa48EFee5007D427e85579135a8201b8971a0058"},{"sig":"0xcaad11f04c92ce9115dc826b8bca14b1c00b1279d64f1bee316077ebc50885bc39a9fed8a92b68c244bf0129cb9a8ea1affc9a1b42b805424b8bbab8d379d83f1c","derivedVia":"web3.eth.personal.sign","signedMessage":"localhost wants you to sign in with your Ethereum account:\\n0x25Da42DBB1a41eEb8D1Ec3d8cEa4545BBea0D949\\n\\nThis is a test statement.  You can put anything you want here. I further authorize the stated URI to perform the following actions on my behalf: (1) 'Threshold': 'Execution' for 'lit-litaction://*'. (2) 'Threshold': 'Signing' for 'lit-pkp://*'.\\n\\nURI: lit:session:675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4\\nVersion: 1\\nChain ID: 1\\nNonce: 0xb98fdd4c2ca6b647764180f3e6c08d33327232a670d2c955d244316b4e2f15e9\\nIssued At: 2025-03-25T01:21:59.366Z\\nExpiration Time: 2025-03-26T01:21:59.364Z\\nResources:\\n- urn:recap:eyJhdHQiOnsibGl0LWxpdGFjdGlvbjovLyoiOnsiVGhyZXNob2xkL0V4ZWN1dGlvbiI6W3t9XX0sImxpdC1wa3A6Ly8qIjp7IlRocmVzaG9sZC9TaWduaW5nIjpbe31dfX0sInByZiI6W119","address":"0x25Da42DBB1a41eEb8D1Ec3d8cEa4545BBea0D949"}],"issuedAt":"2025-03-25T01:21:59.395Z","expiration":"2025-03-26T01:21:59.364Z","nodeAddress":"https://184.107.182.142:443"}`,
      address:
        '675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4',
      algo: 'ed25519',
    },
    'https://173.208.0.151:443': {
      sig: 'e4aa5183ef2633b11f0cd5444c8ba54b1c72e68583c831e59f6f32dbb4d1d1a8bfbc2efd608a7d24282c5f9c05edcc36161a1802b236a567b7cdab8adcb37f02',
      derivedVia: 'litSessionSignViaNacl',
      signedMessage: `{"sessionKey":"675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4","resourceAbilityRequests":[{"resource":{"resource":"*","resourcePrefix":"lit-pkp"},"ability":"pkp-signing"},{"resource":{"resource":"*","resourcePrefix":"lit-litaction"},"ability":"lit-action-execution"}],"capabilities":[{"sig":"0x1e8a313ba62ff4d3234d0bcc0e17745295e386d6138d819e55ac72177e6431636962678c928bc0e00d21b001f6540342c4876cc17ca75ee467387f540ae295471c","derivedVia":"web3.eth.personal.sign","signedMessage":"localhost wants you to sign in with your Ethereum account:\\n0xEa48EFee5007D427e85579135a8201b8971a0058\\n\\nThis is a test statement.  You can put anything you want here. I further authorize the stated URI to perform the following actions on my behalf: (1) 'Auth': 'Auth' for 'lit-ratelimitincrease://151889'.\\n\\nURI: lit:capability:delegation\\nVersion: 1\\nChain ID: 1\\nNonce: 0xb98fdd4c2ca6b647764180f3e6c08d33327232a670d2c955d244316b4e2f15e9\\nIssued At: 2025-03-25T01:21:56.236Z\\nExpiration Time: 2025-04-01T01:21:56.232Z\\nResources:\\n- urn:recap:eyJhdHQiOnsibGl0LXJhdGVsaW1pdGluY3JlYXNlOi8vMTUxODg5Ijp7IkF1dGgvQXV0aCI6W3sibmZ0X2lkIjpbIjE1MTg4OSJdLCJ1c2VzIjoiMjAwIn1dfX0sInByZiI6W119","address":"0xEa48EFee5007D427e85579135a8201b8971a0058"},{"sig":"0xcaad11f04c92ce9115dc826b8bca14b1c00b1279d64f1bee316077ebc50885bc39a9fed8a92b68c244bf0129cb9a8ea1affc9a1b42b805424b8bbab8d379d83f1c","derivedVia":"web3.eth.personal.sign","signedMessage":"localhost wants you to sign in with your Ethereum account:\\n0x25Da42DBB1a41eEb8D1Ec3d8cEa4545BBea0D949\\n\\nThis is a test statement.  You can put anything you want here. I further authorize the stated URI to perform the following actions on my behalf: (1) 'Threshold': 'Execution' for 'lit-litaction://*'. (2) 'Threshold': 'Signing' for 'lit-pkp://*'.\\n\\nURI: lit:session:675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4\\nVersion: 1\\nChain ID: 1\\nNonce: 0xb98fdd4c2ca6b647764180f3e6c08d33327232a670d2c955d244316b4e2f15e9\\nIssued At: 2025-03-25T01:21:59.366Z\\nExpiration Time: 2025-03-26T01:21:59.364Z\\nResources:\\n- urn:recap:eyJhdHQiOnsibGl0LWxpdGFjdGlvbjovLyoiOnsiVGhyZXNob2xkL0V4ZWN1dGlvbiI6W3t9XX0sImxpdC1wa3A6Ly8qIjp7IlRocmVzaG9sZC9TaWduaW5nIjpbe31dfX0sInByZiI6W119","address":"0x25Da42DBB1a41eEb8D1Ec3d8cEa4545BBea0D949"}],"issuedAt":"2025-03-25T01:21:59.395Z","expiration":"2025-03-26T01:21:59.364Z","nodeAddress":"https://173.208.0.151:443"}`,
      address:
        '675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4',
      algo: 'ed25519',
    },
    'https://23.111.254.108:443': {
      sig: '10162215af36bb15f2f20553db8fdf923e4b463a8ace62ac9259c55fdc7a2050a374a62abd138092d9f6c80410b0f3dd66aeec944a78cc7f4d5ad91dc2620d01',
      derivedVia: 'litSessionSignViaNacl',
      signedMessage: `{"sessionKey":"675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4","resourceAbilityRequests":[{"resource":{"resource":"*","resourcePrefix":"lit-pkp"},"ability":"pkp-signing"},{"resource":{"resource":"*","resourcePrefix":"lit-litaction"},"ability":"lit-action-execution"}],"capabilities":[{"sig":"0x1e8a313ba62ff4d3234d0bcc0e17745295e386d6138d819e55ac72177e6431636962678c928bc0e00d21b001f6540342c4876cc17ca75ee467387f540ae295471c","derivedVia":"web3.eth.personal.sign","signedMessage":"localhost wants you to sign in with your Ethereum account:\\n0xEa48EFee5007D427e85579135a8201b8971a0058\\n\\nThis is a test statement.  You can put anything you want here. I further authorize the stated URI to perform the following actions on my behalf: (1) 'Auth': 'Auth' for 'lit-ratelimitincrease://151889'.\\n\\nURI: lit:capability:delegation\\nVersion: 1\\nChain ID: 1\\nNonce: 0xb98fdd4c2ca6b647764180f3e6c08d33327232a670d2c955d244316b4e2f15e9\\nIssued At: 2025-03-25T01:21:56.236Z\\nExpiration Time: 2025-04-01T01:21:56.232Z\\nResources:\\n- urn:recap:eyJhdHQiOnsibGl0LXJhdGVsaW1pdGluY3JlYXNlOi8vMTUxODg5Ijp7IkF1dGgvQXV0aCI6W3sibmZ0X2lkIjpbIjE1MTg4OSJdLCJ1c2VzIjoiMjAwIn1dfX0sInByZiI6W119","address":"0xEa48EFee5007D427e85579135a8201b8971a0058"},{"sig":"0xcaad11f04c92ce9115dc826b8bca14b1c00b1279d64f1bee316077ebc50885bc39a9fed8a92b68c244bf0129cb9a8ea1affc9a1b42b805424b8bbab8d379d83f1c","derivedVia":"web3.eth.personal.sign","signedMessage":"localhost wants you to sign in with your Ethereum account:\\n0x25Da42DBB1a41eEb8D1Ec3d8cEa4545BBea0D949\\n\\nThis is a test statement.  You can put anything you want here. I further authorize the stated URI to perform the following actions on my behalf: (1) 'Threshold': 'Execution' for 'lit-litaction://*'. (2) 'Threshold': 'Signing' for 'lit-pkp://*'.\\n\\nURI: lit:session:675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4\\nVersion: 1\\nChain ID: 1\\nNonce: 0xb98fdd4c2ca6b647764180f3e6c08d33327232a670d2c955d244316b4e2f15e9\\nIssued At: 2025-03-25T01:21:59.366Z\\nExpiration Time: 2025-03-26T01:21:59.364Z\\nResources:\\n- urn:recap:eyJhdHQiOnsibGl0LWxpdGFjdGlvbjovLyoiOnsiVGhyZXNob2xkL0V4ZWN1dGlvbiI6W3t9XX0sImxpdC1wa3A6Ly8qIjp7IlRocmVzaG9sZC9TaWduaW5nIjpbe31dfX0sInByZiI6W119","address":"0x25Da42DBB1a41eEb8D1Ec3d8cEa4545BBea0D949"}],"issuedAt":"2025-03-25T01:21:59.395Z","expiration":"2025-03-26T01:21:59.364Z","nodeAddress":"https://23.111.254.108:443"}`,
      address:
        '675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4',
      algo: 'ed25519',
    },
    'https://207.244.66.41:443': {
      sig: '0c2e6617946a793be5c26bd8644ec6d4fb85c41384e637fad9504a1ea565ae31b42848d971b615a60ea4aa844e34f9d98bf07a66aeff5470124facfc27264800',
      derivedVia: 'litSessionSignViaNacl',
      signedMessage: `{"sessionKey":"675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4","resourceAbilityRequests":[{"resource":{"resource":"*","resourcePrefix":"lit-pkp"},"ability":"pkp-signing"},{"resource":{"resource":"*","resourcePrefix":"lit-litaction"},"ability":"lit-action-execution"}],"capabilities":[{"sig":"0x1e8a313ba62ff4d3234d0bcc0e17745295e386d6138d819e55ac72177e6431636962678c928bc0e00d21b001f6540342c4876cc17ca75ee467387f540ae295471c","derivedVia":"web3.eth.personal.sign","signedMessage":"localhost wants you to sign in with your Ethereum account:\\n0xEa48EFee5007D427e85579135a8201b8971a0058\\n\\nThis is a test statement.  You can put anything you want here. I further authorize the stated URI to perform the following actions on my behalf: (1) 'Auth': 'Auth' for 'lit-ratelimitincrease://151889'.\\n\\nURI: lit:capability:delegation\\nVersion: 1\\nChain ID: 1\\nNonce: 0xb98fdd4c2ca6b647764180f3e6c08d33327232a670d2c955d244316b4e2f15e9\\nIssued At: 2025-03-25T01:21:56.236Z\\nExpiration Time: 2025-04-01T01:21:56.232Z\\nResources:\\n- urn:recap:eyJhdHQiOnsibGl0LXJhdGVsaW1pdGluY3JlYXNlOi8vMTUxODg5Ijp7IkF1dGgvQXV0aCI6W3sibmZ0X2lkIjpbIjE1MTg4OSJdLCJ1c2VzIjoiMjAwIn1dfX0sInByZiI6W119","address":"0xEa48EFee5007D427e85579135a8201b8971a0058"},{"sig":"0xcaad11f04c92ce9115dc826b8bca14b1c00b1279d64f1bee316077ebc50885bc39a9fed8a92b68c244bf0129cb9a8ea1affc9a1b42b805424b8bbab8d379d83f1c","derivedVia":"web3.eth.personal.sign","signedMessage":"localhost wants you to sign in with your Ethereum account:\\n0x25Da42DBB1a41eEb8D1Ec3d8cEa4545BBea0D949\\n\\nThis is a test statement.  You can put anything you want here. I further authorize the stated URI to perform the following actions on my behalf: (1) 'Threshold': 'Execution' for 'lit-litaction://*'. (2) 'Threshold': 'Signing' for 'lit-pkp://*'.\\n\\nURI: lit:session:675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4\\nVersion: 1\\nChain ID: 1\\nNonce: 0xb98fdd4c2ca6b647764180f3e6c08d33327232a670d2c955d244316b4e2f15e9\\nIssued At: 2025-03-25T01:21:59.366Z\\nExpiration Time: 2025-03-26T01:21:59.364Z\\nResources:\\n- urn:recap:eyJhdHQiOnsibGl0LWxpdGFjdGlvbjovLyoiOnsiVGhyZXNob2xkL0V4ZWN1dGlvbiI6W3t9XX0sImxpdC1wa3A6Ly8qIjp7IlRocmVzaG9sZC9TaWduaW5nIjpbe31dfX0sInByZiI6W119","address":"0x25Da42DBB1a41eEb8D1Ec3d8cEa4545BBea0D949"}],"issuedAt":"2025-03-25T01:21:59.395Z","expiration":"2025-03-26T01:21:59.364Z","nodeAddress":"https://207.244.66.41:443"}`,
      address:
        '675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4',
      algo: 'ed25519',
    },
    'https://207.244.90.225:443': {
      sig: 'aa9ddd6c3b782c25b9548f5cbc30fb476d38385ae27a4bc7858557554116200d2cd9c09ca82c9a6778ec6825c4cadce9deb58fc6d9e382b3df81915d831a8a04',
      derivedVia: 'litSessionSignViaNacl',
      signedMessage: `{"sessionKey":"675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4","resourceAbilityRequests":[{"resource":{"resource":"*","resourcePrefix":"lit-pkp"},"ability":"pkp-signing"},{"resource":{"resource":"*","resourcePrefix":"lit-litaction"},"ability":"lit-action-execution"}],"capabilities":[{"sig":"0x1e8a313ba62ff4d3234d0bcc0e17745295e386d6138d819e55ac72177e6431636962678c928bc0e00d21b001f6540342c4876cc17ca75ee467387f540ae295471c","derivedVia":"web3.eth.personal.sign","signedMessage":"localhost wants you to sign in with your Ethereum account:\\n0xEa48EFee5007D427e85579135a8201b8971a0058\\n\\nThis is a test statement.  You can put anything you want here. I further authorize the stated URI to perform the following actions on my behalf: (1) 'Auth': 'Auth' for 'lit-ratelimitincrease://151889'.\\n\\nURI: lit:capability:delegation\\nVersion: 1\\nChain ID: 1\\nNonce: 0xb98fdd4c2ca6b647764180f3e6c08d33327232a670d2c955d244316b4e2f15e9\\nIssued At: 2025-03-25T01:21:56.236Z\\nExpiration Time: 2025-04-01T01:21:56.232Z\\nResources:\\n- urn:recap:eyJhdHQiOnsibGl0LXJhdGVsaW1pdGluY3JlYXNlOi8vMTUxODg5Ijp7IkF1dGgvQXV0aCI6W3sibmZ0X2lkIjpbIjE1MTg4OSJdLCJ1c2VzIjoiMjAwIn1dfX0sInByZiI6W119","address":"0xEa48EFee5007D427e85579135a8201b8971a0058"},{"sig":"0xcaad11f04c92ce9115dc826b8bca14b1c00b1279d64f1bee316077ebc50885bc39a9fed8a92b68c244bf0129cb9a8ea1affc9a1b42b805424b8bbab8d379d83f1c","derivedVia":"web3.eth.personal.sign","signedMessage":"localhost wants you to sign in with your Ethereum account:\\n0x25Da42DBB1a41eEb8D1Ec3d8cEa4545BBea0D949\\n\\nThis is a test statement.  You can put anything you want here. I further authorize the stated URI to perform the following actions on my behalf: (1) 'Threshold': 'Execution' for 'lit-litaction://*'. (2) 'Threshold': 'Signing' for 'lit-pkp://*'.\\n\\nURI: lit:session:675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4\\nVersion: 1\\nChain ID: 1\\nNonce: 0xb98fdd4c2ca6b647764180f3e6c08d33327232a670d2c955d244316b4e2f15e9\\nIssued At: 2025-03-25T01:21:59.366Z\\nExpiration Time: 2025-03-26T01:21:59.364Z\\nResources:\\n- urn:recap:eyJhdHQiOnsibGl0LWxpdGFjdGlvbjovLyoiOnsiVGhyZXNob2xkL0V4ZWN1dGlvbiI6W3t9XX0sImxpdC1wa3A6Ly8qIjp7IlRocmVzaG9sZC9TaWduaW5nIjpbe31dfX0sInByZiI6W119","address":"0x25Da42DBB1a41eEb8D1Ec3d8cEa4545BBea0D949"}],"issuedAt":"2025-03-25T01:21:59.395Z","expiration":"2025-03-26T01:21:59.364Z","nodeAddress":"https://207.244.90.225:443"}`,
      address:
        '675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4',
      algo: 'ed25519',
    },
    'https://23.82.129.77:443': {
      sig: '7bd07b5c0ddd46977ed1986ad472d66a7569c243258d626079e96d44caff1ddb4c23d3dc084aaad4c0153dba8092ee086ac40b8422e0be132ceaae18205ded00',
      derivedVia: 'litSessionSignViaNacl',
      signedMessage: `{"sessionKey":"675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4","resourceAbilityRequests":[{"resource":{"resource":"*","resourcePrefix":"lit-pkp"},"ability":"pkp-signing"},{"resource":{"resource":"*","resourcePrefix":"lit-litaction"},"ability":"lit-action-execution"}],"capabilities":[{"sig":"0x1e8a313ba62ff4d3234d0bcc0e17745295e386d6138d819e55ac72177e6431636962678c928bc0e00d21b001f6540342c4876cc17ca75ee467387f540ae295471c","derivedVia":"web3.eth.personal.sign","signedMessage":"localhost wants you to sign in with your Ethereum account:\\n0xEa48EFee5007D427e85579135a8201b8971a0058\\n\\nThis is a test statement.  You can put anything you want here. I further authorize the stated URI to perform the following actions on my behalf: (1) 'Auth': 'Auth' for 'lit-ratelimitincrease://151889'.\\n\\nURI: lit:capability:delegation\\nVersion: 1\\nChain ID: 1\\nNonce: 0xb98fdd4c2ca6b647764180f3e6c08d33327232a670d2c955d244316b4e2f15e9\\nIssued At: 2025-03-25T01:21:56.236Z\\nExpiration Time: 2025-04-01T01:21:56.232Z\\nResources:\\n- urn:recap:eyJhdHQiOnsibGl0LXJhdGVsaW1pdGluY3JlYXNlOi8vMTUxODg5Ijp7IkF1dGgvQXV0aCI6W3sibmZ0X2lkIjpbIjE1MTg4OSJdLCJ1c2VzIjoiMjAwIn1dfX0sInByZiI6W119","address":"0xEa48EFee5007D427e85579135a8201b8971a0058"},{"sig":"0xcaad11f04c92ce9115dc826b8bca14b1c00b1279d64f1bee316077ebc50885bc39a9fed8a92b68c244bf0129cb9a8ea1affc9a1b42b805424b8bbab8d379d83f1c","derivedVia":"web3.eth.personal.sign","signedMessage":"localhost wants you to sign in with your Ethereum account:\\n0x25Da42DBB1a41eEb8D1Ec3d8cEa4545BBea0D949\\n\\nThis is a test statement.  You can put anything you want here. I further authorize the stated URI to perform the following actions on my behalf: (1) 'Threshold': 'Execution' for 'lit-litaction://*'. (2) 'Threshold': 'Signing' for 'lit-pkp://*'.\\n\\nURI: lit:session:675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4\\nVersion: 1\\nChain ID: 1\\nNonce: 0xb98fdd4c2ca6b647764180f3e6c08d33327232a670d2c955d244316b4e2f15e9\\nIssued At: 2025-03-25T01:21:59.366Z\\nExpiration Time: 2025-03-26T01:21:59.364Z\\nResources:\\n- urn:recap:eyJhdHQiOnsibGl0LWxpdGFjdGlvbjovLyoiOnsiVGhyZXNob2xkL0V4ZWN1dGlvbiI6W3t9XX0sImxpdC1wa3A6Ly8qIjp7IlRocmVzaG9sZC9TaWduaW5nIjpbe31dfX0sInByZiI6W119","address":"0x25Da42DBB1a41eEb8D1Ec3d8cEa4545BBea0D949"}],"issuedAt":"2025-03-25T01:21:59.395Z","expiration":"2025-03-26T01:21:59.364Z","nodeAddress":"https://23.82.129.77:443"}`,
      address:
        '675b1986c4a595e33ed1de3e59cf410025da6349bb628bc3a75787c43dd70ce4',
      algo: 'ed25519',
    },
  };

  beforeAll(async () => {
    pkpPubKey =
      '041754e8c133f4099b8380615590f066d69a9cc186bd150244d1a7315a74369f7d314826dcc82586abf6ecc6947f52828c5af38ee9b57a94ba214a3b37f02a6484';

    litNodeClient = new LitNodeClient({
      litNetwork: 'datil',
    });

    await litNodeClient.connect();
  });

  it('should create a viem account', async () => {
    const account = await createViemAccount({
      litNodeClient,
      pkpPubKey,
      controllerSessionSigs,
    });
    expect(account).toBeDefined();

    const signedMessageTx = await account.signMessage({
      message: 'Hello, world!',
    });

    const signedTx = await account.signTransaction({
      type: 'eip1559',
      to: '0x0000000000000000000000000000000000000000',
      value: BigInt(11),
      chainId: 1,
    });

    const signedTypedData = await account.signTypedData({
      domain: {
        name: 'Test',
        version: '1',
        chainId: 1,
      },
      primaryType: 'Test',
      message: {
        test: 'test',
      },
      types: {
        Test: [{ name: 'test', type: 'string' }],
      },
    });

    console.log('✅ signedMessageTx', signedMessageTx);
    console.log('✅ signedTx', signedTx);
    console.log('✅ signedTypedData', signedTypedData);
  });
});
