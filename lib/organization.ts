/** One company can be credited under two names: Amazon and its Builders' Library, Facebook before it became Meta. Treat each as one organization. */
export const organization = (company: string) => (company.startsWith("Amazon") ? "Amazon" : company === "Facebook" ? "Meta" : company);

/** What a merged organization is called where several credits share one mark: Amazon (the Dynamo paper) and AWS (the Builders' Library) share the AWS mark, so the homepage says both. */
export const MIXED_LABEL: Record<string, string> = { Amazon: "Amazon and AWS" };

/** Listed organizations that are not companies, so the homepage says so instead of calling them all companies. */
export const NOT_COMPANIES = ["etcd (CNCF)"];
