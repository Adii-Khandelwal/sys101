/** One company can be credited twice (Amazon, and its Builders' Library): treat it as one organization. */
export const organization = (company: string) => (company.startsWith("Amazon") ? "Amazon" : company);
