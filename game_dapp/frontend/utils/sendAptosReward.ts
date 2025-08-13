// utils/sendAptosReward.ts
// Usage: await sendAptosReward(playerAddress)

/**
 * Sends 0.001 APT from the connected Petra wallet to the given player address (testnet).
 * @param playerAddress The recipient's wallet address (string)
 * @returns Promise<string> Transaction hash if successful
 */
export async function sendAptosReward(playerAddress: string): Promise<string> {
  if (!(window as any).aptos) throw new Error("Petra wallet not found");
  // 0.001 APT in Octas (1 APT = 1e8 Octas)
  const amount = "100000"; // 0.001 APT = 100_000 Octas
  try {
    const tx = await (window as any).aptos.signAndSubmitTransaction({
      type: "entry_function_payload",
      function: "0x1::aptos_account::transfer",
      arguments: [playerAddress, amount],
      type_arguments: [],
    });
    return tx.hash;
  } catch (e: any) {
    throw new Error(e?.message || "Failed to send reward");
  }
}
