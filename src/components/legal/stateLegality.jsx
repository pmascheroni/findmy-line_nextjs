// US States where online sports betting is legal (as of 2024)
// This list should be kept updated as laws change

export const LEGAL_STATES = [
  'AZ', // Arizona
  'CO', // Colorado
  'CT', // Connecticut
  'DC', // Washington D.C.
  'DE', // Delaware
  'IA', // Iowa
  'IL', // Illinois
  'IN', // Indiana
  'KS', // Kansas
  'KY', // Kentucky
  'LA', // Louisiana
  'MA', // Massachusetts
  'MD', // Maryland
  'ME', // Maine
  'MI', // Michigan
  'NC', // North Carolina
  'NH', // New Hampshire
  'NJ', // New Jersey
  'NV', // Nevada
  'NY', // New York
  'OH', // Ohio
  'OR', // Oregon
  'PA', // Pennsylvania
  'RI', // Rhode Island
  'TN', // Tennessee
  'VA', // Virginia
  'VT', // Vermont
  'WV', // West Virginia
  'WY', // Wyoming
];

export const ILLEGAL_STATES = [
  'AL', // Alabama
  'AK', // Alaska
  'AR', // Arkansas
  'CA', // California
  'FL', // Florida
  'GA', // Georgia
  'HI', // Hawaii
  'ID', // Idaho
  'MN', // Minnesota
  'MO', // Missouri
  'MS', // Mississippi
  'MT', // Montana
  'NE', // Nebraska
  'NM', // New Mexico
  'ND', // North Dakota
  'OK', // Oklahoma
  'SC', // South Carolina
  'SD', // South Dakota
  'TX', // Texas
  'UT', // Utah
  'WA', // Washington
  'WI', // Wisconsin
];

export function isStateLegal(stateCode) {
  if (!stateCode) return null; // Unknown
  return LEGAL_STATES.includes(stateCode.toUpperCase());
}

export function getStateFullName(stateCode) {
  const stateNames = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'DC': 'Washington D.C.', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii',
    'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine',
    'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
    'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska',
    'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico',
    'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island',
    'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas',
    'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
    'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
  };
  return stateNames[stateCode?.toUpperCase()] || stateCode;
}