export type RhTab =
  | "dashboard"
  | "deploy"
  | "contracts"
  | "rewards"
  | "explorer"
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
