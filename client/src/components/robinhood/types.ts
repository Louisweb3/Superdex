export type RhTab =
  | "dashboard"
  | "contracts"
  | "deployments"
  | "analytics"
  | "settings";

export type DeployedToken = {
  name: string;
  symbol: string;
  supply: string;
  address: string;
  txHash: string;
  deployedAt: number;
  network: string;
  verifyStatus?: "pending" | "verified" | "failed";
};
