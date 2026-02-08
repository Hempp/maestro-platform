/**
 * SOULBOUND TOKEN (SBT) MINTING SYSTEM
 * Polygon-based non-transferable certificates
 * Uses Thirdweb for simplified minting
 */

import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import type { SBTMetadata, VerificationResult } from '@/types';
import { verificationEngine } from '@/lib/verification/verification-engine';

// ═══════════════════════════════════════════════════════════════════════════
// SBT MINTER SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export interface MintResult {
  success: boolean;
  tokenId?: string;
  transactionHash?: string;
  explorerUrl?: string;
  error?: string;
}

export class SBTMinter {
  private _sdk: ThirdwebSDK | null = null;
  private _contractAddress: string | null = null;

  private get sdk(): ThirdwebSDK {
    if (!this._sdk) {
      if (!process.env.PHAZUR_WALLET_PRIVATE_KEY) {
        throw new Error('PHAZUR_WALLET_PRIVATE_KEY is not configured');
      }
      // Initialize Thirdweb SDK for Polygon
      this._sdk = ThirdwebSDK.fromPrivateKey(
        process.env.PHAZUR_WALLET_PRIVATE_KEY,
        'polygon', // Use 'mumbai' for testnet
        {
          secretKey: process.env.THIRDWEB_SECRET_KEY,
        }
      );
    }
    return this._sdk;
  }

  private get contractAddress(): string {
    if (!this._contractAddress) {
      if (!process.env.SBT_CONTRACT_ADDRESS) {
        throw new Error('SBT_CONTRACT_ADDRESS is not configured');
      }
      this._contractAddress = process.env.SBT_CONTRACT_ADDRESS;
    }
    return this._contractAddress;
  }

  /**
   * Mint an SBT certificate for a completed mastery path
   */
  async mintCertificate(
    walletAddress: string,
    verificationResult: VerificationResult,
    masteryPath: string,
    completedAKUs: string[]
  ): Promise<MintResult> {
    try {
      // Generate metadata
      const metadata = verificationEngine.generateSBTMetadata(
        verificationResult,
        masteryPath,
        completedAKUs
      );

      // Sign the verification (proves Phazur verified this)
      const signedMetadata = await this.signMetadata(metadata);

      // Get the contract
      const contract = await this.sdk.getContract(this.contractAddress);

      // Mint the SBT
      const tx = await contract.erc721.mintTo(walletAddress, {
        name: signedMetadata.name,
        description: signedMetadata.description,
        image: signedMetadata.image,
        attributes: signedMetadata.attributes,
        properties: {
          phazur: signedMetadata.phazur,
        },
      });

      return {
        success: true,
        tokenId: tx.id.toString(),
        transactionHash: tx.receipt.transactionHash,
        explorerUrl: `https://polygonscan.com/tx/${tx.receipt.transactionHash}`,
      };
    } catch (error) {
      console.error('SBT minting failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown minting error',
      };
    }
  }

  /**
   * Sign metadata with Phazur's verification signature
   */
  private async signMetadata(metadata: SBTMetadata): Promise<SBTMetadata> {
    // Create a hash of the critical verification data
    const verificationPayload = JSON.stringify({
      masteryPath: metadata.phazur.masteryPath,
      akusCompleted: metadata.phazur.akusCompleted,
      struggleScore: metadata.phazur.struggleScore,
      deploymentTimestamp: metadata.phazur.deploymentTimestamp,
      workflowHash: metadata.phazur.workflowHash,
    });

    // Sign with the Phazur wallet
    const signer = this.sdk.getSigner();
    if (!signer) {
      throw new Error('No signer available');
    }

    const signature = await signer.signMessage(verificationPayload);

    return {
      ...metadata,
      phazur: {
        ...metadata.phazur,
        verificationSignature: signature,
      },
    };
  }

  /**
   * Verify an existing SBT certificate
   * Used by employers to validate credentials
   */
  async verifyCertificate(tokenId: string): Promise<{
    valid: boolean;
    metadata?: SBTMetadata;
    owner?: string;
    error?: string;
  }> {
    try {
      const contract = await this.sdk.getContract(this.contractAddress);

      // Get token metadata
      const nft = await contract.erc721.get(tokenId);
      const metadata = nft.metadata as unknown as SBTMetadata;

      // Get owner
      const owner = await contract.erc721.ownerOf(tokenId);

      // Verify the signature
      const isValid = await this.verifySignature(metadata);

      return {
        valid: isValid,
        metadata,
        owner,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Verify the Phazur signature on certificate metadata
   */
  private async verifySignature(metadata: SBTMetadata): Promise<boolean> {
    try {
      const verificationPayload = JSON.stringify({
        masteryPath: metadata.phazur.masteryPath,
        akusCompleted: metadata.phazur.akusCompleted,
        struggleScore: metadata.phazur.struggleScore,
        deploymentTimestamp: metadata.phazur.deploymentTimestamp,
        workflowHash: metadata.phazur.workflowHash,
      });

      // Recover the signer address from the signature (ethers v5)
      const { utils } = await import('ethers');
      const recoveredAddress = utils.verifyMessage(
        verificationPayload,
        metadata.phazur.verificationSignature
      );

      // Compare with known Phazur verification address
      const phazurVerifierAddress = process.env.PHAZUR_VERIFIER_ADDRESS;
      return recoveredAddress.toLowerCase() === phazurVerifierAddress?.toLowerCase();
    } catch {
      return false;
    }
  }

  /**
   * Get all certificates for a wallet
   */
  async getCertificatesForWallet(walletAddress: string): Promise<{
    tokenId: string;
    metadata: SBTMetadata;
  }[]> {
    try {
      const contract = await this.sdk.getContract(this.contractAddress);
      const nfts = await contract.erc721.getOwned(walletAddress);

      return nfts.map(nft => ({
        tokenId: nft.metadata.id.toString(),
        metadata: nft.metadata as unknown as SBTMetadata,
      }));
    } catch (error) {
      console.error('Failed to get certificates:', error);
      return [];
    }
  }

  /**
   * Check if a wallet has a specific mastery certification
   */
  async hasMasteryCertification(
    walletAddress: string,
    masteryPath: string
  ): Promise<boolean> {
    const certificates = await this.getCertificatesForWallet(walletAddress);
    return certificates.some(
      cert => cert.metadata.phazur.masteryPath === masteryPath
    );
  }
}

export const sbtMinter = new SBTMinter();

// ═══════════════════════════════════════════════════════════════════════════
// SOLIDITY CONTRACT REFERENCE (Deploy via Thirdweb)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The SBT contract should be deployed via Thirdweb with these characteristics:
 *
 * 1. Base: ERC721 Non-Transferable
 * 2. Network: Polygon (or Mumbai for testnet)
 * 3. Features:
 *    - Minting restricted to Phazur wallet
 *    - Transfer disabled (Soulbound)
 *    - Burn enabled (in case of revocation)
 *    - Metadata on IPFS
 *
 * Deployment steps:
 * 1. Go to thirdweb.com/explore
 * 2. Deploy "NFT Collection" contract
 * 3. Disable transfers in contract settings
 * 4. Set Phazur wallet as minter
 * 5. Save contract address to .env as SBT_CONTRACT_ADDRESS
 *
 * Or use this custom Solidity:
 *
 * // SPDX-License-Identifier: MIT
 * pragma solidity ^0.8.20;
 *
 * import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
 * import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
 * import "@openzeppelin/contracts/access/Ownable.sol";
 *
 * contract PhazurSBT is ERC721, ERC721URIStorage, Ownable {
 *     uint256 private _tokenIdCounter;
 *
 *     constructor() ERC721("Phazur Mastery", "PHAZUR") Ownable(msg.sender) {}
 *
 *     function mint(address to, string memory uri) public onlyOwner returns (uint256) {
 *         uint256 tokenId = _tokenIdCounter++;
 *         _safeMint(to, tokenId);
 *         _setTokenURI(tokenId, uri);
 *         return tokenId;
 *     }
 *
 *     // Disable transfers - Soulbound
 *     function _update(address to, uint256 tokenId, address auth)
 *         internal override returns (address)
 *     {
 *         address from = _ownerOf(tokenId);
 *         if (from != address(0) && to != address(0)) {
 *             revert("Soulbound: Transfer disabled");
 *         }
 *         return super._update(to, tokenId, auth);
 *     }
 *
 *     // Required overrides
 *     function tokenURI(uint256 tokenId)
 *         public view override(ERC721, ERC721URIStorage)
 *         returns (string memory)
 *     {
 *         return super.tokenURI(tokenId);
 *     }
 *
 *     function supportsInterface(bytes4 interfaceId)
 *         public view override(ERC721, ERC721URIStorage)
 *         returns (bool)
 *     {
 *         return super.supportsInterface(interfaceId);
 *     }
 * }
 */
