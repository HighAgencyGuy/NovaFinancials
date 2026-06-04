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

export const banksByCountry: Record<string, string[]> = {
  "United States": ["JPMorgan Chase", "Bank of America", "Wells Fargo", "Citibank", "U.S. Bank", "PNC Bank", "Capital One", "TD Bank"],
  "United Kingdom": ["Barclays", "HSBC UK", "Lloyds Bank", "NatWest", "Santander UK", "Standard Chartered", "Monzo", "Revolut"],
  "Germany": ["Deutsche Bank", "Commerzbank", "KfW", "DZ Bank", "N26", "ING-DiBa", "Sparkasse"],
  "France": ["BNP Paribas", "Crédit Agricole", "Société Générale", "Crédit Mutuel", "La Banque Postale", "BPCE"],
  "Canada": ["Royal Bank of Canada", "TD Canada Trust", "Scotiabank", "BMO", "CIBC", "National Bank of Canada"],
  "Nigeria": ["First Bank", "GTBank", "Access Bank", "Zenith Bank", "UBA", "Stanbic IBTC", "Fidelity Bank", "Wema Bank", "FCMB", "Sterling Bank"],
  "South Africa": ["Standard Bank", "FNB", "ABSA", "Nedbank", "Capitec Bank", "Investec"],
  "Ghana": ["GCB Bank", "Ecobank Ghana", "Absa Ghana", "Stanbic Ghana", "Fidelity Ghana", "Zenith Ghana"],
  "Kenya": ["Equity Bank", "KCB Bank", "Co-operative Bank", "Standard Chartered Kenya", "Absa Kenya", "NCBA"],
  "UAE": ["Emirates NBD", "First Abu Dhabi Bank", "ADCB", "Mashreq", "Dubai Islamic Bank", "RAKBANK"],
  "India": ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra", "Punjab National Bank"],
  "China": ["ICBC", "China Construction Bank", "Agricultural Bank of China", "Bank of China", "Bank of Communications"],
  "Japan": ["MUFG Bank", "Sumitomo Mitsui", "Mizuho Bank", "Japan Post Bank", "Resona Bank"],
  "Australia": ["Commonwealth Bank", "Westpac", "ANZ", "NAB", "Macquarie Bank", "Bendigo Bank"],
  "Singapore": ["DBS Bank", "OCBC Bank", "UOB", "Standard Chartered Singapore", "Citibank Singapore"],
};

export const banks = banksByCountry["Nigeria"];
