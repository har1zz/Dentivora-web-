/** Single source of truth for public clinic details. Replace with the real clinic's before launch.
 *  The phone number uses the reserved fictional 555-01xx range, so it can't reach a real person. */
export const CLINIC = {
  name: "Dentivora",
  street: "2418 Lakeview Drive",
  city: "Austin",
  region: "TX",
  postal: "78704",
  country: "United States",
  phoneDisplay: "+1 (512) 555-0147",
  phoneTel: "+15125550147",
  email: "harizzz191@gmail.com",
  phoneExample: "+1 512 555 0147",
  mapBbox: "-97.85%2C30.20%2C-97.65%2C30.36",
} as const;
