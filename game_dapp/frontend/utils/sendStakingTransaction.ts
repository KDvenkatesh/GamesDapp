import { HexString } from "aptos";
import { wallet } from "@petra/wallet-api"; // or your wallet provider of choice

const MODULE_ADDRESS = "0x7906ab5611f09e6241ea7a5bf8273d86299c52d9559a390d47a2482acb953d9d";

export async function sendStakingTransaction(playerAddress: string, assetId: number, stakedTime: number) {
  if (!wallet.isConnected()) {
    throw new Error("Wallet not connected.");
  }

  const transaction = {
    function: `${MODULE_ADDRESS}::Games::stake_mystery_data`,
    type_arguments: [],
    arguments: [
      playerAddress,
      new HexString(playerAddress).toShortString(),
      assetId,
      stakedTime,
    ],
  };

  try {
    const result = await wallet.signAndSubmitTransaction(transaction);
    console.log("Staking transaction successful:", result);
    return result;
  } catch (error) {
    console.error("Staking transaction failed:", error);
    throw error;
  }
}