const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || "";
const BASESCAN_URL = "https://api.basescan.org/api";
const CHAIN_ID = 8453;

export async function verifyTransaction(txHash: string): Promise<{
  ok: boolean;
  from?: string;
  to?: string;
  value?: string;
  gasUsed?: string;
  blockNumber?: string;
  status?: string;
  err?: string;
}> {
  if (!BASESCAN_API_KEY) {
    return { ok: false, err: "No BASESCAN_API_KEY configured" };
  }
  try {
    const url = `${BASESCAN_URL}?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${BASESCAN_API_KEY}`;
    const resp = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await resp.json();
    if (data.status !== "1") {
      return { ok: false, err: data.result || "Transaction not found" };
    }

    // Get detailed tx info for value
    const txUrl = `${BASESCAN_URL}?module=transaction&action=gettxinfo&txhash=${txHash}&apikey=${BASESCAN_API_KEY}`;
    const txResp = await fetch(txUrl, { headers: { Accept: "application/json" } });
    const txData = await txResp.json();
    const result = txData.result || {};

    return {
      ok: true,
      from: result.from,
      to: result.to,
      value: result.value,
      gasUsed: result.gasUsed,
      blockNumber: result.blockNumber,
      status: result.txreceipt_status,
    };
  } catch (e: any) {
    return { ok: false, err: e.message };
  }
}
