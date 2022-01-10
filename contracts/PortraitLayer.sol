// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "./BaseIlluvitar.sol";
import "./interfaces/IAccessoryLayer.sol";
import "./interfaces/IPortraitLayer.sol";

/**
    @title PortraitLayer, this contract is inherited BaseIlluvitar contract,
    this contract contains the function of combination and NFT metadata.
    @author Dmitry Yakovlevich
 */

contract PortraitLayer is IPortraitLayer, BaseIlluvitar, ERC721HolderUpgradeable {
    /**
     * @notice event emitted when list of accessory pairs (tokenId, type) are combined to the base layer.
     * @dev emitted in {combine} function.
     * @param tokenId base layer token id.
     * @param accessoryType accessory type.
     * @param accessoryId accessory id to be combined.
     */
    event Combined(uint256 tokenId, IAccessoryLayer.AccessoryType accessoryType, uint256 accessoryId);

    // Metadata for each accessories
    struct Metadata {
        uint8 tier;
        mapping(IAccessoryLayer.AccessoryType => uint256) accessories;
    }

    // Metadata mapping
    mapping(uint256 => Metadata) private _metadatas;
    // Illuvitar accessory address mapping
    mapping(IAccessoryLayer.AccessoryType => address) public override accessoryIlluvitars;
    // Indicates accessory illuvatar
    mapping(address => bool) public isAccessoryIlluvitar;

    /**
     * @notice Initialize Base Layer.
     * @param name_ NFT Name.
     * @param symbol_ NFT Symbol.
     * @param _minter NFT Minter Address.
     * @param _accessories List of accessory items.
     */
    function initialize(
        string memory name_,
        string memory symbol_,
        address _minter,
        address[] calldata _accessories
    ) external initializer {
        __BaseIlluvitar_init(name_, symbol_, _minter);
        __ERC721Holder_init();

        uint256 accessoryTypeCounts = 5;
        require(_accessories.length == accessoryTypeCounts, "invalid length");
        for (uint256 i = 0; i < accessoryTypeCounts; i += 1) {
            IAccessoryLayer.AccessoryType type_ = IAccessoryLayer(_accessories[i]).layerType();
            require(address(accessoryIlluvitars[type_]) == address(0), "already set");
            accessoryIlluvitars[type_] = _accessories[i];
            isAccessoryIlluvitar[_accessories[i]] = true;
        }
    }

    /**
     * @notice Combine list of accessory pairs (tokenId, type) onto tokenId of base layer.
     * @param tokenId Base Layer tokenId.
     * @param types List of accessory type.
     * @param accessoryIds Accessory tokenIds.
     */
    function combine(
        uint256 tokenId,
        IAccessoryLayer.AccessoryType[] calldata types,
        uint256[] calldata accessoryIds
    ) external {
        require(types.length > 0 && types.length == accessoryIds.length, "Invalid length");

        Metadata storage metadata = _metadatas[tokenId];

        for (uint256 i = 0; i < types.length; i += 1) {
            require(metadata.accessories[types[i]] == 0, "Already combined");
            IERC721Upgradeable(accessoryIlluvitars[types[i]]).safeTransferFrom(
                msg.sender,
                address(this),
                accessoryIds[i]
            );
            metadata.accessories[types[i]] = accessoryIds[i];
            emit Combined(tokenId, types[i], accessoryIds[i]);
        }
    }

    /**
     * @notice Get Metadata of combined item.
     * @param tokenId Base Layer tokenId.
     * @return tier and all the accessories (EYE, BODY, MOUTH, HEAD)
     */
    function getMetadata(uint256 tokenId)
        external
        view
        returns (
            uint8,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        return (
            _metadatas[tokenId].tier,
            _metadatas[tokenId].accessories[IAccessoryLayer.AccessoryType.Skin],
            _metadatas[tokenId].accessories[IAccessoryLayer.AccessoryType.Body],
            _metadatas[tokenId].accessories[IAccessoryLayer.AccessoryType.EyeWear],
            _metadatas[tokenId].accessories[IAccessoryLayer.AccessoryType.HeadWear],
            _metadatas[tokenId].accessories[IAccessoryLayer.AccessoryType.Props]
        );
    }

    /**
     * @notice Make sure to receive only accessory layer
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) public override returns (bytes4) {
        require(isAccessoryIlluvitar[_msgSender()], "Not accessory");
        return this.onERC721Received.selector;
    }
}
