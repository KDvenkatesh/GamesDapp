import { aptosClient } from "@/utils/aptosClient";
import { MODULE_ADDRESS } from "@/constants";

export async function getTreasureHuntData(address: string) {
  const resourceType = `${MODULE_ADDRESS}::Games::TreasureData`;
  try {
    const data = await aptosClient().getAccountResource({
      accountAddress: address,
      resourceType,
    });
    return data;
  } catch (e) {
    return null;
  }
}
