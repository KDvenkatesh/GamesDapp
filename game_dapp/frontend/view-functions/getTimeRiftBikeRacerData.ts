import { aptosClient } from "@/utils/aptosClient";
import { MODULE_ADDRESS } from "@/constants";

export async function getTimeRiftBikeRacerData(address: string) {
  const resourceType = `${MODULE_ADDRESS}::Games::TimeRiftData`;
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
