// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PhazurSBT - Soulbound Token for Phazur Credentials
 * @notice Non-transferable credential tokens for AI mastery certification
 * @dev Implements ERC721 with transfer restrictions for Soulbound behavior
 *
 * Deployment:
 * - Network: Polygon Mainnet (or Mumbai for testing)
 * - Deploy via Thirdweb, Hardhat, or Remix
 * - Set deployer as initial minter
 * - Store contract address in SBT_CONTRACT_ADDRESS env var
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract PhazurSBT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    using Strings for uint256;

    // Token counter for unique IDs
    uint256 private _tokenIdCounter;

    // Mapping from tokenId to certificate type
    mapping(uint256 => string) public certificateType;

    // Mapping from tokenId to issuance timestamp
    mapping(uint256 => uint256) public issuedAt;

    // Mapping from tokenId to verification hash (links to off-chain data)
    mapping(uint256 => bytes32) public verificationHash;

    // Authorized minters (Phazur backend wallets)
    mapping(address => bool) public authorizedMinters;

    // Events
    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string certificateType,
        bytes32 verificationHash,
        uint256 timestamp
    );

    event CertificateRevoked(
        uint256 indexed tokenId,
        string reason,
        uint256 timestamp
    );

    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);

    // Custom errors
    error SoulboundTokenNotTransferable();
    error NotAuthorizedMinter();
    error InvalidRecipient();
    error TokenDoesNotExist();

    /**
     * @notice Constructor sets up the contract with Phazur branding
     * @dev Deployer becomes owner and initial authorized minter
     */
    constructor() ERC721("Phazur Mastery Credential", "PHAZUR") Ownable(msg.sender) {
        // Owner is automatically an authorized minter
        authorizedMinters[msg.sender] = true;
        emit MinterAuthorized(msg.sender);
    }

    /**
     * @notice Modifier to restrict minting to authorized addresses
     */
    modifier onlyMinter() {
        if (!authorizedMinters[msg.sender] && msg.sender != owner()) {
            revert NotAuthorizedMinter();
        }
        _;
    }

    /**
     * @notice Authorize a new minter address
     * @param minter Address to authorize for minting
     */
    function authorizeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }

    /**
     * @notice Revoke minting authorization
     * @param minter Address to revoke
     */
    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }

    /**
     * @notice Mint a new Soulbound credential
     * @param to Recipient wallet address
     * @param uri IPFS URI for token metadata
     * @param certType Type of certification (student, employee, owner)
     * @param _verificationHash Hash of verification data for integrity check
     * @return tokenId The ID of the newly minted token
     */
    function mint(
        address to,
        string memory uri,
        string memory certType,
        bytes32 _verificationHash
    ) public onlyMinter returns (uint256) {
        if (to == address(0)) {
            revert InvalidRecipient();
        }

        uint256 tokenId = _tokenIdCounter++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        certificateType[tokenId] = certType;
        issuedAt[tokenId] = block.timestamp;
        verificationHash[tokenId] = _verificationHash;

        emit CertificateMinted(tokenId, to, certType, _verificationHash, block.timestamp);

        return tokenId;
    }

    /**
     * @notice Batch mint multiple credentials
     * @dev Useful for issuing credentials to multiple graduates at once
     */
    function batchMint(
        address[] calldata recipients,
        string[] calldata uris,
        string[] calldata certTypes,
        bytes32[] calldata _verificationHashes
    ) external onlyMinter returns (uint256[] memory) {
        require(
            recipients.length == uris.length &&
            uris.length == certTypes.length &&
            certTypes.length == _verificationHashes.length,
            "Array length mismatch"
        );

        uint256[] memory tokenIds = new uint256[](recipients.length);

        for (uint256 i = 0; i < recipients.length; i++) {
            tokenIds[i] = mint(recipients[i], uris[i], certTypes[i], _verificationHashes[i]);
        }

        return tokenIds;
    }

    /**
     * @notice Revoke a certificate (burn the token)
     * @dev Only owner can revoke certificates
     * @param tokenId Token to revoke
     * @param reason Reason for revocation (stored in event)
     */
    function revokeCertificate(uint256 tokenId, string calldata reason) external onlyOwner {
        if (_ownerOf(tokenId) == address(0)) {
            revert TokenDoesNotExist();
        }

        emit CertificateRevoked(tokenId, reason, block.timestamp);
        _burn(tokenId);
    }

    /**
     * @notice Verify a certificate on-chain
     * @param tokenId Token to verify
     * @return exists Whether the token exists
     * @return holder The current holder address
     * @return certType The type of certification
     * @return issued The issuance timestamp
     * @return hash The verification hash
     */
    function verifyCertificate(uint256 tokenId) external view returns (
        bool exists,
        address holder,
        string memory certType,
        uint256 issued,
        bytes32 hash
    ) {
        address owner = _ownerOf(tokenId);

        if (owner == address(0)) {
            return (false, address(0), "", 0, bytes32(0));
        }

        return (
            true,
            owner,
            certificateType[tokenId],
            issuedAt[tokenId],
            verificationHash[tokenId]
        );
    }

    /**
     * @notice Get all tokens owned by an address
     * @param owner Address to query
     * @return tokenIds Array of token IDs owned
     */
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);

        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }

        return tokenIds;
    }

    /**
     * @notice Check if an address holds a specific certification type
     * @param holder Address to check
     * @param certType Certification type to look for
     * @return hasCert Whether the address holds this certification
     * @return tokenId The token ID if found (0 if not)
     */
    function hasCertification(address holder, string calldata certType) external view returns (
        bool hasCert,
        uint256 tokenId
    ) {
        uint256 tokenCount = balanceOf(holder);

        for (uint256 i = 0; i < tokenCount; i++) {
            uint256 id = tokenOfOwnerByIndex(holder, i);
            if (keccak256(bytes(certificateType[id])) == keccak256(bytes(certType))) {
                return (true, id);
            }
        }

        return (false, 0);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SOULBOUND TRANSFER RESTRICTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Override _update to prevent transfers (Soulbound behavior)
     * @dev Allows minting (from == 0) and burning (to == 0) but blocks transfers
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        address from = _ownerOf(tokenId);

        // Block transfers - only allow minting and burning
        if (from != address(0) && to != address(0)) {
            revert SoulboundTokenNotTransferable();
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Override approve to prevent approvals (Soulbound)
     */
    function approve(address, uint256) public pure override(ERC721, IERC721) {
        revert SoulboundTokenNotTransferable();
    }

    /**
     * @notice Override setApprovalForAll to prevent approvals (Soulbound)
     */
    function setApprovalForAll(address, bool) public pure override(ERC721, IERC721) {
        revert SoulboundTokenNotTransferable();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REQUIRED OVERRIDES
    // ═══════════════════════════════════════════════════════════════════════════

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
