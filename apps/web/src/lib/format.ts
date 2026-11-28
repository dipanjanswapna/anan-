const amountFormatter = new Intl.NumberFormat("en-BD");

/** Format integer paisa (as stored by the API) into a BDT label without decimals where possible. */
export function formatTaka(value: string | number | bigint): string {
  const paisa = typeof value === "string" ? BigInt(value) : BigInt(Math.trunc(Number(value)));
  const whole = amountFormatter.format(paisa / 100n);
  const fraction = (paisa % 100n).toString().padStart(2, "0").replace(/0+$/, "");
  return `৳${whole}${fraction ? `.${fraction}` : ""}`;
}

/** Convert a taka input string (for example "1,250.50") into integer paisa. Returns null when invalid. */
export function takaToPaisa(value: string): number | null {
  const normalized = value.replace(/[৳,\s]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

/** Convert integer paisa into a plain taka string for form inputs. */
export function paisaToTakaInput(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const paisa = typeof value === "string" ? BigInt(value) : BigInt(Math.trunc(Number(value)));
  const whole = (paisa / 100n).toString();
  const fraction = (paisa % 100n).toString().padStart(2, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

export function formatDate(value: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric", ...options }).format(date);
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

export function prettyStatus(value: string): string {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
}

export function discountPercent(pricePaisa: string, compareAtPricePaisa: string | null): number | null {
  if (!compareAtPricePaisa) return null;
  const price = BigInt(pricePaisa);
  const compareAt = BigInt(compareAtPricePaisa);
  if (compareAt <= price || compareAt <= 0n) return null;
  return Number(((compareAt - price) * 100n) / compareAt);
}
