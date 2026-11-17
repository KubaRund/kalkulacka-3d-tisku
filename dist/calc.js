export const EXAMPLE = Object.freeze({
  scope: "unit", grams: "38", quantity: "4", hours: "1", minutes: "35", spoolPrice: "620",
  spoolGrams: "1000", power: "95", electricity: "6", reserve: "8", wear: "0",
});

const numericFields = Object.keys(EXAMPLE).filter((name) => name !== "scope");
const optionalFields = new Set(["reserve", "wear"]);

export function parseNumber(raw) {
  const literal = String(raw ?? "").trim().replace(/\s/g, "");
  if (!/^[+-]?(\d+([.,]\d*)?|[.,]\d+)$/.test(literal)) return NaN;
  return Number(literal.replace(",", "."));
}

export function estimate(input) {
  const numbers = {};
  const errors = {};
  for (const name of numericFields) {
    const raw = input[name];
    const blank = String(raw ?? "").trim() === "";
    const value = blank && optionalFields.has(name) ? 0 : parseNumber(raw);
    numbers[name] = value;
    if (!Number.isFinite(value) || value < 0) errors[name] = "Zadej nezáporné číslo.";
  }
  if (!Number.isSafeInteger(numbers.quantity) || numbers.quantity < 1) {
    errors.quantity = "Zadej celý počet alespoň 1.";
  }
  if (!Number.isSafeInteger(numbers.hours) || numbers.hours < 0) {
    errors.hours = "Zadej celé hodiny.";
  }
  if (!Number.isSafeInteger(numbers.minutes) || numbers.minutes < 0 || numbers.minutes > 59) {
    errors.minutes = "Zadej 0 až 59 minut.";
  }
  if (!(numbers.spoolGrams > 0)) errors.spoolGrams = "Hmotnost musí být větší než 0 g.";
  if (input.scope !== "unit" && input.scope !== "batch") errors.scope = "Vyber rozsah údajů.";
  if (Object.keys(errors).length) return { errors, totals: null };

  const { grams, quantity, hours, minutes, spoolPrice, spoolGrams, power, electricity, reserve, wear } = numbers;
  const multiplier = input.scope === "unit" ? quantity : 1;
  const batchGrams = grams * multiplier;
  const batchMinutes = (hours * 60 + minutes) * multiplier;
  const batchHours = batchMinutes / 60;
  const kiloWattHours = batchHours * (power / 1000);
  const filamentCost = batchGrams * (spoolPrice / spoolGrams);
  const energyCost = kiloWattHours * electricity;
  const reserveCost = filamentCost * (reserve / 100);
  const wearCost = batchHours * wear;
  const batchCost = filamentCost + energyCost + reserveCost + wearCost;
  const totals = {
    quantity, batchGrams, batchMinutes, kiloWattHours, filamentCost, energyCost,
    reserveCost, wearCost, batchCost, unitCost: batchCost / quantity,
  };
  if (!Number.isSafeInteger(batchMinutes) || Object.values(totals).some((value) => !Number.isFinite(value))) {
    return { errors: { range: "Některá hodnota je pro výpočet příliš velká." }, totals: null };
  }
  return { errors, totals };
}
