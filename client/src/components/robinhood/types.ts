export type RhTab =
  | "dashboard"
  | "contracts"
  | "deployments"
  | "analytics"
  | "rewards";

export type DeployedToken = {
  name: string;
  symbol: string;
  supply: string;
  address: string;
  txHash: string;
  deployedAt: number;
  network: string;
  verifyStatus?: "pending" | "verified" | "failed";
  imageUrl?: string;
  gasUsed?: string;
};
