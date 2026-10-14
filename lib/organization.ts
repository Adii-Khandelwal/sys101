/** One company can be credited under two names: Amazon and its Builders' Library, Facebook before it became Meta. Treat each as one organization. */
export const organization = (company: string) => (company.startsWith("Amazon") ? "Amazon" : company === "Facebook" ? "Meta" : company);
