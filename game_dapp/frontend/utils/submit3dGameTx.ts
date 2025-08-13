import { aptosClient } from "@/utils/aptosClient";
import { MODULE_ADDRESS } from "@/constants";

export async function openTreasureChest(signer: any, reward: number, itemId: number) {
  return aptosClient().submitTransaction({
    sender: signer.address,
    data: {
      function: `${MODULE_ADDRESS}::Games::open_treasure_chest`,
      typeArguments: [],
      arguments: [reward, itemId],
    },
  });
}

export async function recordRacing3D(signer: any, win: boolean, vehicle: number) {
  return aptosClient().submitTransaction({
    sender: signer.address,
    data: {
      function: `${MODULE_ADDRESS}::Games::record_race`,
      typeArguments: [],
      arguments: [win, vehicle],
    },
  });
}

export async function recordTimeRiftRun(signer: any, time: number, seed: number) {
  return aptosClient().submitTransaction({
    sender: signer.address,
    data: {
      function: `${MODULE_ADDRESS}::Games::record_time_rift_run`,
      typeArguments: [],
      arguments: [time, seed],
    },
  });
}

export async function recordBattleRoyale(signer: any, win: boolean, skin: number) {
  return aptosClient().submitTransaction({
    sender: signer.address,
    data: {
      function: `${MODULE_ADDRESS}::Games::record_battle_royale`,
      typeArguments: [],
      arguments: [win, skin],
    },
  });
}
