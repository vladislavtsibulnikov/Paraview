// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "./IAccessoryLayer.sol";

/**
 * @title Portrait layer interface
 */

interface IPortraitLayer {
    function accessoryIlluvitars(IAccessoryLayer.AccessoryType) external view returns (address);
}
