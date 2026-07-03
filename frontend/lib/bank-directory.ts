// lib/bank-directory.ts
export interface BankItem {
    id: string;
    name: string;
    domain: string;
    category: 'PUBLIC' | 'PRIVATE' | 'SMALL_FINANCE' | 'PAYMENTS' | 'RURAL' | 'FOREIGN' | 'COOPERATIVE' | 'LOCAL';
}

export const INDIAN_BANK_DIRECTORY: BankItem[] = [
    // === PUBLIC SECTOR BANKS ===
    { id: "sbi", name: "State Bank of India", domain: "sbi.co.in", category: "PUBLIC" },
    { id: "bob", name: "Bank of Baroda", domain: "bankofbaroda.in", category: "PUBLIC" },
    { id: "boi", name: "Bank of India", domain: "bankofindia.co.in", category: "PUBLIC" },
    { id: "bom", name: "Bank of Maharashtra", domain: "bankofmaharashtra.in", category: "PUBLIC" },
    { id: "canara", name: "Canara Bank", domain: "canarabank.com", category: "PUBLIC" },
    { id: "central-bank", name: "Central Bank of India", domain: "centralbankofindia.co.in", category: "PUBLIC" },
    { id: "indian-bank", name: "Indian Bank", domain: "indianbank.in", category: "PUBLIC" },
    { id: "iob", name: "Indian Overseas Bank", domain: "iob.in", category: "PUBLIC" },
    { id: "pnb", name: "Punjab National Bank", domain: "pnbindia.in", category: "PUBLIC" },
    { id: "psb", name: "Punjab & Sind Bank", domain: "punjabandsindbank.co.in", category: "PUBLIC" },
    { id: "uco", name: "UCO Bank", domain: "ucobank.com", category: "PUBLIC" },
    { id: "union-bank", name: "Union Bank of India", domain: "unionbankofindia.co.in", category: "PUBLIC" },

    // === PRIVATE SECTOR BANKS ===
    { id: "axis", name: "Axis Bank Limited", domain: "axisbank.com", category: "PRIVATE" },
    { id: "bandhan", name: "Bandhan Bank Limited", domain: "bandhanbank.com", category: "PRIVATE" },
    { id: "csb", name: "CSB Bank Limited", domain: "csb.co.in", category: "PRIVATE" },
    { id: "cub", name: "City Union Bank Limited", domain: "cityunionbank.com", category: "PRIVATE" },
    { id: "dcb", name: "DCB Bank Limited", domain: "dcbbank.com", category: "PRIVATE" },
    { id: "dhanlaxmi", name: "Dhanlaxmi Bank Limited", domain: "dhanbank.com", category: "PRIVATE" },
    { id: "federal", name: "Federal Bank Limited", domain: "federalbank.co.in", category: "PRIVATE" },
    { id: "hdfc", name: "HDFC Bank Limited", domain: "hdfc.bank.in", category: "PRIVATE" },
    { id: "icici", name: "ICICI Bank Limited", domain: "icicibank.com", category: "PRIVATE" },
    { id: "indusind", name: "IndusInd Bank Limited", domain: "indusind.com", category: "PRIVATE" },
    { id: "idfc-first", name: "IDFC FIRST Bank Limited", domain: "idfcfirstbank.com", category: "PRIVATE" },
    { id: "jk-bank", name: "Jammu & Kashmir Bank Limited", domain: "jkbank.com", category: "PRIVATE" },
    { id: "karnataka-bank", name: "Karnataka Bank Limited", domain: "karnatakabank.com", category: "PRIVATE" },
    { id: "kvb", name: "Karur Vysya Bank Limited", domain: "kvb.co.in", category: "PRIVATE" },
    { id: "kotak", name: "Kotak Mahindra Bank Limited", domain: "kotak.com", category: "PRIVATE" },
    { id: "nainital", name: "Nainital Bank Limited", domain: "nainitalbank.co.in", category: "PRIVATE" },
    { id: "rbl", name: "RBL Bank Limited", domain: "rblbank.com", category: "PRIVATE" },
    { id: "sib", name: "South Indian Bank Limited", domain: "southindianbank.com", category: "PRIVATE" },
    { id: "tmb", name: "Tamilnad Mercantile Bank Limited", domain: "tmb.in", category: "PRIVATE" },
    { id: "yes-bank", name: "YES Bank Limited", domain: "yesbank.in", category: "PRIVATE" },
    { id: "idbi", name: "IDBI Bank Limited", domain: "idbibank.in", category: "PRIVATE" },

    // === LOCAL AREA BANKS ===
    { id: "coastal-local", name: "Coastal Local Area Bank Ltd.", domain: "coastalareabank.com", category: "LOCAL" },
    { id: "krishna-bhima", name: "Krishna Bhima Samruddhi Local Area Bank Limited", domain: "kbslab.com", category: "LOCAL" },

    // === SMALL FINANCE BANKS ===
    { id: "au-small", name: "AU Small Finance Bank Limited", domain: "aubank.in", category: "SMALL_FINANCE" },
    { id: "capital-small", name: "Capital Small Finance Bank Limited", domain: "capitalbank.co.in", category: "SMALL_FINANCE" },
    { id: "equitas-small", name: "Equitas Small Finance Bank Limited", domain: "equitasbank.com", category: "SMALL_FINANCE" },
    { id: "esaf-small", name: "ESAF Small Finance Bank Limited", domain: "esafbank.com", category: "SMALL_FINANCE" },
    { id: "suryoday-small", name: "Suryoday Small Finance Bank Limited", domain: "suryodaybank.com", category: "SMALL_FINANCE" },
    { id: "ujjivan-small", name: "Ujjivan Small Finance Bank Limited", domain: "ujjivansfb.in", category: "SMALL_FINANCE" },
    { id: "utkarsh-small", name: "Utkarsh Small Finance Bank Limited", domain: "utkarsh.bank", category: "SMALL_FINANCE" },
    { id: "slice-small", name: "slice Small Finance Bank Limited", domain: "sliceit.com", category: "SMALL_FINANCE" },
    { id: "jana-small", name: "Jana Small Finance Bank Limited", domain: "janabank.com", category: "SMALL_FINANCE" },
    { id: "shivalik-small", name: "Shivalik Small Finance Bank Limited", domain: "shivalikbank.com", category: "SMALL_FINANCE" },
    { id: "unity-small", name: "Unity Small Finance Bank Limited", domain: "unitybank.co.in", category: "SMALL_FINANCE" },

    // === PAYMENTS BANKS ===
    { id: "airtel-payment", name: "Airtel Payments Bank Limited", domain: "airtel.in/bank", category: "PAYMENTS" },
    { id: "ippb-payment", name: "India Post Payments Bank Limited", domain: "ippbonline.com", category: "PAYMENTS" },
    { id: "fino-payment", name: "Fino Payments Bank Limited", domain: "finobank.com", category: "PAYMENTS" },
    { id: "jio-payment", name: "Jio Payments Bank Limited", domain: "jiobank.com", category: "PAYMENTS" },
    { id: "nsdl-payment", name: "NSDL Payments Bank Limited", domain: "nsdlbank.com", category: "PAYMENTS" },
    { id: "paytm-payment", name: "Paytm Payments Bank Limited", domain: "paytmbank.com", category: "PAYMENTS" },

    // === REGIONAL RURAL BANKS (RRBs) ===
    { id: "ap-grameena", name: "Andhra Pradesh Grameena Bank", domain: "apgb.in", category: "RURAL" },
    { id: "assam-gramin", name: "Assam Gramin Bank", domain: "agvb.co.in", category: "RURAL" },
    { id: "arunachal-rural", name: "Arunachal Pradesh Rural Bank", domain: "apruralbank.co.in", category: "RURAL" },
    { id: "telangana-grameena", name: "Telangana Grameena Bank", domain: "tgbhyd.in", category: "RURAL" },

    // === FOREIGN BANKS ===
    { id: "barclays", name: "Barclays Bank Plc.", domain: "barclays.in", category: "FOREIGN" },
    { id: "bnp-paribas", name: "BNP Paribas", domain: "bnpparibas.co.in", category: "FOREIGN" },
    { id: "citibank", name: "Citibank N.A.", domain: "citibank.co.in", category: "FOREIGN" },
    { id: "deutsche", name: "Deutsche Bank A.G.", domain: "deutschebank.co.in", category: "FOREIGN" },
    { id: "hsbc", name: "Hong Kong and Shanghai Banking Corporation Limited", domain: "hsbc.co.in", category: "FOREIGN" },
    { id: "jpmorgan", name: "J.P. Morgan Chase Bank N.A.", domain: "jpmorgan.com", category: "FOREIGN" },
    { id: "standard-chartered", name: "Standard Chartered Bank", domain: "sc.com/in", category: "FOREIGN" },
    { id: "dbs", name: "DBS Bank India Limited", domain: "dbs.com/in", category: "FOREIGN" },

    // === STATE CO-OPERATIVE BANKS ===
    { id: "ap-coop", name: "The Andhra Pradesh State Co-operative Bank Ltd.", domain: "apcob.org", category: "COOPERATIVE" },
    { id: "msc-coop", name: "The Maharashtra State Co-operative Bank Ltd.", domain: "mscbank.com", category: "COOPERATIVE" },
    { id: "tsc-coop", name: "The Telangana State Cooperative Apex Bank Ltd.", domain: "tscob.org", category: "COOPERATIVE" }
];