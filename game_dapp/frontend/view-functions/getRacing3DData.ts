import { aptosClient } from "@/utils/aptosClient";
import { MODULE_ADDRESS } from "@/constants";

export async function getRacing3DData(address: string) {
  const resourceType = `${MODULE_ADDRESS}::Games::RacingData`;
  try {
    const data = await aptosClient().getAccountResource({
      accountAddress: address,
      resourceType: resourceType as `${string}::${string}::${string}`,
    });
    return data;
  } catch (e) {
    return null;
  }
}
