import { Wallet, utils, BigNumber } from "ethers";
import type { BigNumberish } from "ethers";

// we use assert to fail fast in case of any errors
import assert from "assert";

export enum AccessoryType {
  Skin = 0,
  Body = 1,
  EyeWear = 2,
  HeadWear = 3,
  Props = 4,
}

export enum BoxType {
  Virtual = 0,
  Bronze = 1,
  Silver = 2,
  Gold = 3,
  Platinum = 4,
  Diamond = 5,
}

export interface IAccessoryPrices {
  randomPrice: BigNumberish;
  semiRandomPrice: BigNumberish;
}

class AccessoryPrices implements IAccessoryPrices {
  randomPrice;
  semiRandomPrice;

  constructor(_randomPrice: BigNumberish, _semiRandomPrice: BigNumberish) {
    this.randomPrice = _randomPrice;
    this.semiRandomPrice = _semiRandomPrice;
  }
}

export interface PortraitMintParams {
  boxType: BoxType; // box type
  amount: BigNumberish; // portrait amount to mint
}

export interface AccessorySemiRandomMintParams {
  accessoryType: AccessoryType; // accessory type
  boxType: BoxType; // box type
  amount: BigNumberish; // accessory amount to mint
}

export interface AccessoryFullRandomMintParams {
  boxType: BoxType; // box type
  amount: BigNumberish; // portrait amount to mint
}

export const CENTIETHER: BigNumberish = BigNumber.from(10).pow(16);

export const centiethers = (cents: number): BigNumberish => {
  return BigNumber.from(cents).mul(CENTIETHER);
};

export const accessoryPrices = {
  [BoxType.Virtual]: new AccessoryPrices(0, 0),
  [BoxType.Bronze]: new AccessoryPrices(centiethers(5), centiethers(10)),
  [BoxType.Silver]: new AccessoryPrices(centiethers(10), centiethers(20)),
  [BoxType.Gold]: new AccessoryPrices(centiethers(15), centiethers(30)),
  [BoxType.Platinum]: new AccessoryPrices(centiethers(20), centiethers(40)),
  [BoxType.Diamond]: new AccessoryPrices(centiethers(25), centiethers(50)),
};

export const portraitPrices = {
  [BoxType.Virtual]: 0,
  [BoxType.Bronze]: centiethers(5),
  [BoxType.Silver]: centiethers(10),
  [BoxType.Gold]: centiethers(25),
  [BoxType.Platinum]: centiethers(75),
  [BoxType.Diamond]: centiethers(250),
};

// generates random integer in [from, to) range
export const random_int = (from: number, to: number): number => {
  assert(from <= to, '"from" must not exceed "to"');
  return Math.floor(from + Math.random() * (to - from));
};

// picks random element from the array
export const random_element = (array: any[], flat: boolean = true): any | { e: any; i: number } => {
  assert(array.length, "empty array");
  const i = random_int(0, array.length);
  const e = array[i];
  return flat ? e : { e, i };
};

export const generateRandomAddress = (): string => Wallet.createRandom().address;

export const makePortraitMintingBlob = (
  tokenId: BigNumberish,
  boxType: BoxType,
  tier: number,
  skinId: BigNumberish,
  bodyId: BigNumberish,
  eyeId: BigNumberish,
  headId: BigNumberish,
  propsId: BigNumberish,
): string => {
  return utils.solidityPack(
    ["string"],
    [`{${tokenId.toString()}}:{${boxType}${tier},${skinId},${bodyId},${eyeId},${headId},${propsId}}`],
  );
};

export const makeAccessoryMintingBlob = (
  tokenId: BigNumberish,
  boxType: BoxType,
  tier: number,
  acccessoryType: AccessoryType,
): string => {
  return utils.formatBytes32String(`{${tokenId.toString()}}:{${boxType}${tier}${acccessoryType}}`);
};

export const generatePurchaseParams = (
  portraitMintMaxLength: number = 3,
  accessorySemiRandomMintMaxLength: number = 3,
  accessoryFullRandomMintMaxLength: number = 3,
  maxAmountPerMint: number = 2,
): {
  portraitMintParams: PortraitMintParams[];
  accessorySemiRandomMintParams: AccessorySemiRandomMintParams[];
  accessoryFullRandomMintParams: AccessoryFullRandomMintParams[];
  etherPrice: BigNumberish;
} => {
  const boxTypeNumbers = Object.values(BoxType).filter(value => Number.isInteger(value));
  const accessoryTypeNumbers = Object.values(AccessoryType).filter(value => Number.isInteger(value));
  const getRandomAmount = () => BigNumber.from(random_int(1, maxAmountPerMint));

  let etherPrice = BigNumber.from(0);

  const portraitMintParams = [];
  const portraitMintLength = random_int(1, portraitMintMaxLength + 1);
  for (let i = 0; i < portraitMintLength; i++) {
    portraitMintParams.push({
      boxType: random_element(boxTypeNumbers) as BoxType,
      amount: getRandomAmount(),
    });
    etherPrice = etherPrice.add(portraitMintParams[i].amount.mul(portraitPrices[portraitMintParams[i].boxType]));
  }

  const accessorySemiRandomMintParams = [];
  const accessorySemiRandomMintLength = random_int(1, accessorySemiRandomMintMaxLength + 1);
  for (let i = 0; i < accessorySemiRandomMintLength; i++) {
    accessorySemiRandomMintParams.push({
      accessoryType: random_element(accessoryTypeNumbers) as AccessoryType,
      boxType: random_element(boxTypeNumbers) as BoxType,
      amount: getRandomAmount(),
    });
    etherPrice = etherPrice.add(
      accessorySemiRandomMintParams[i].amount.mul(
        accessoryPrices[accessorySemiRandomMintParams[i].boxType].semiRandomPrice,
      ),
    );
  }

  const accessoryFullRandomMintParams = [];
  const accessoryFullRandomMintLength = random_int(1, accessoryFullRandomMintMaxLength + 1);
  for (let i = 0; i < accessoryFullRandomMintLength; i++) {
    accessoryFullRandomMintParams.push({
      boxType: random_element(boxTypeNumbers) as BoxType,
      amount: getRandomAmount(),
    });
    etherPrice = etherPrice.add(
      accessoryFullRandomMintParams[i].amount.mul(
        accessoryPrices[accessoryFullRandomMintParams[i].boxType].randomPrice,
      ),
    );
  }

  return {
    portraitMintParams,
    accessorySemiRandomMintParams,
    accessoryFullRandomMintParams,
    etherPrice,
  };
};
