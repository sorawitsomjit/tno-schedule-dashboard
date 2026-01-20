// This file allows you to define specific colors for each Proposal ID.
// The system supports all standard Tailwind CSS colors. 
// Valid formats: 'bg-{color}-{shade}'
//
// Available Colors:
// - Slate, Gray, Zinc, Neutral, Stone
// - Red, Orange, Amber, Yellow, Lime, Green, Emerald, Teal, Cyan, Sky, Blue, Indigo, Violet, Purple, Fuchsia, Pink, Rose
//
// Available Shades: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950
// (Use 500 or 600 for best background visibility)

// ============================================
// 2.4m Telescope Proposal IDs
// ============================================
export const PROPOSAL_COLORS_24M: Record<string, string> = {
    "ID001": "bg-lime-200",
    "ID002": "bg-sky-500",
    "ID003": "bg-neutral-500",
    "ID004": "bg-rose-400",
    "ID005": "bg-amber-200",
    "ID006": "bg-blue-500",
    "ID007": "bg-orange-200",
    "ID008": "bg-yellow-200",
    "ID009": "bg-cyan-200",
    "ID010": "bg-violet-200",
    "ID011": "bg-rose-500",
    "ID013": "bg-green-500",
    "ID014": "bg-rose-50",
    "ID015": "bg-violet-300",
    "ID016": "bg-neutral-300",
    "ID017": "bg-fuchsia-300",
    "ID018": "bg-pink-400",
    "ID019": "bg-green-400",
    "ID020": "bg-teal-400",
    "ID021": "bg-orange-300",
    "ID022": "bg-blue-300",
};

// ============================================
// 1m Telescope Proposal IDs
// ============================================
export const PROPOSAL_COLORS_1M: Record<string, string> = {
    "ID001": "bg-pink-300",
    "ID002": "bg-amber-200",
    "ID003": "bg-lime-600",
    "ID004": "bg-blue-300",
    "ID005": "bg-amber-400",
    "ID006": "bg-purple-800",
    "OUT": "bg-indigo-700",
};

// ============================================
// Engineering / Maintenance / Special Sessions
// (Shared across both telescopes)
// ============================================
export const PROPOSAL_COLORS: Record<string, string> = {
    "Calibration": "bg-neutral-900",
    "GTO": "bg-rose-200",
    "DDT": "bg-green-200",
    "OPD": "bg-gray-400",
    "ENG": "bg-yellow-300",
    "BUF": "bg-white",
    "Opt": "bg-sky-800",
    "Open House": "bg-yellow-300",
};

// Default fallback colors for rotation if ID is not matched
// The system now picks a color based on the Proposal ID's characters, 
// ensuring the same ID always gets the same default color from this list.
export const DEFAULT_COLOR_ROTATION = [
    'bg-cyan-600',
    'bg-sky-600',
    'bg-indigo-600',
    'bg-teal-600',
    'bg-violet-600',
    'bg-rose-600',
    'bg-blue-600',
    'bg-fuchsia-600'
];
