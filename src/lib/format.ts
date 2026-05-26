export const NGN = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(n);

export const fmtNumber = (n: number) =>
  new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 }).format(n);

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

export const randomId = () =>
  (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2));

export const randomDigits = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");

export const newAccountNumber = () => `NOVA-${randomDigits(10)}`;
export const newTxnRef = () => `NOVA-TXN-${randomDigits(10)}`;

export const maskAccount = (acc: string) =>
  acc.replace(/\d(?=\d{4})/g, "•");

export const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
};

/** Lightweight non-crypto hash; bcryptjs is heavy & not needed for demo. */
export const hash = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(16);
};
