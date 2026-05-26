export const moneyTips = [
  "Pay yourself first — automate 20% of income into savings the day it lands.",
  "Track every naira for one week. Awareness alone changes behavior.",
  "Refinance high-interest debt before chasing investment returns.",
  "Keep 3 months of expenses in a liquid emergency fund.",
  "Index funds beat 80% of active managers over 10+ years.",
  "Negotiate recurring bills annually — 15 minutes can save thousands.",
  "Avoid lifestyle inflation. Save raises before you feel them.",
];

export const loanProducts = [
  { id: "personal", name: "Personal Loan", rate: 14, min: 50000, max: 5_000_000, tenureMonths: [6, 12, 24, 36] },
  { id: "salary", name: "Salary Advance", rate: 9, min: 20000, max: 1_500_000, tenureMonths: [3, 6, 12] },
  { id: "business", name: "Business Capital", rate: 18, min: 250000, max: 25_000_000, tenureMonths: [12, 24, 36, 48] },
  { id: "asset", name: "Asset Finance", rate: 16, min: 500000, max: 15_000_000, tenureMonths: [12, 24, 36] },
];

export const investmentProducts = [
  { id: "treasury", name: "Treasury Bills", rate: 18.5, risk: "Low" as const, tenorDays: 91, min: 100000 },
  { id: "fixed", name: "Fixed Deposit", rate: 14, risk: "Low" as const, tenorDays: 180, min: 50000 },
  { id: "mutual", name: "Mutual Fund (Balanced)", rate: 22, risk: "Medium" as const, tenorDays: 365, min: 25000 },
  { id: "equity", name: "Equity Pool", rate: 31, risk: "High" as const, tenorDays: 365, min: 100000 },
  { id: "dollar", name: "Dollar FX Note", rate: 9, risk: "Low" as const, tenorDays: 270, min: 200000 },
];

export const countries = [
  "United States", "United Kingdom", "Germany", "France", "Canada",
  "Nigeria", "South Africa", "Ghana", "Kenya", "UAE", "India", "China", "Japan", "Australia", "Singapore",
];

export const currencies = ["USD", "EUR", "GBP", "NGN", "ZAR", "CAD", "AUD", "JPY", "AED"];

export const banks = [
  "First Bank", "GTBank", "Access Bank", "Zenith Bank", "UBA",
  "Stanbic IBTC", "Fidelity Bank", "Wema Bank", "FCMB", "Sterling Bank",
];
