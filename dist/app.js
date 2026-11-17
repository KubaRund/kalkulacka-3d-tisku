import { estimate, EXAMPLE } from "./calc.js";
import { readGCodeMetadata } from "./gcode.js";

const byId = (id) => document.getElementById(id);
const form = byId("calculator");
const storageKey = "kalkulacka-3d-tisku-v1";
const currency = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK" });
const number = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 3 });
const fields = Object.keys(EXAMPLE).filter((key) => key !== "scope");
const categories = [
  { name: "filament", label: "Filament", field: "filamentCost" },
  { name: "energy", label: "Elektřina", field: "energyCost" },
  { name: "reserve", label: "Rezerva filamentu", field: "reserveCost", optional: true },
  { name: "wear", label: "Opotřebení", field: "wearCost", optional: true },
];
let latest;

function readForm() {
  return Object.fromEntries(new FormData(form));
}

function fillForm(data) {
  for (const key of fields) form.elements[key].value = data[key];
  form.elements.scope.value = data.scope;
}

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && typeof saved === "object") {
      const result = { ...EXAMPLE };
      for (const name of fields) {
        if (typeof saved[name] === "string") result[name] = saved[name];
      }
      if (saved.scope === "unit" || saved.scope === "batch") result.scope = saved.scope;
      return result;
    }
  } catch {
    // The calculator can still run if the browser blocks storage.
  }
  return EXAMPLE;
}

function formatDuration(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${number.format(hours)} h ${minutes} min` : `${minutes} min`;
}

function renderBreakdown(totals) {
  const bars = [];
  for (const { name, field, optional } of categories) {
    const value = totals?.[field];
    byId(`${name}-cost`).textContent = totals ? currency.format(value) : "—";
    if (optional) byId(`${name}-row`).hidden = !value;
    if (value > 0) {
      const segment = document.createElement("i");
      segment.className = name;
      segment.style.flexGrow = String(value / totals.batchCost);
      bars.push(segment);
    }
  }
  byId("cost-bar").replaceChildren(...bars);
}

function render() {
  const data = readForm();
  const { errors, totals } = estimate(data);
  latest = totals;
  byId("scope-help").textContent = data.scope === "batch"
    ? "Zadej celkovou hmotnost a dobu tisku celé série."
    : "Zadej hmotnost a dobu tisku jednoho kusu.";
  for (const name of fields) {
    form.elements[name].setAttribute("aria-invalid", String(Boolean(errors[name])));
    byId(`${name}-error`).textContent = errors[name] ?? "";
  }
  if (errors.reserve || errors.wear) byId("extras").open = true;
  const error = byId("result-error");
  error.hidden = Boolean(totals);
  error.textContent = totals ? "" : (errors.range ?? "Uprav označené údaje a výsledek se přepočítá.");
  byId("result-quantity").textContent = totals ? `${number.format(totals.quantity)} ks` : "— ks";
  byId("total").textContent = totals ? currency.format(totals.batchCost) : "—";
  byId("unit").textContent = totals ? currency.format(totals.unitCost) : "—";
  byId("copy").disabled = !totals;
  byId("usage").hidden = !totals;
  if (totals) {
    byId("usage-material").textContent = `${number.format(totals.batchGrams)} g filamentu`;
    byId("usage-time").textContent = formatDuration(totals.batchMinutes);
    byId("usage-power").textContent = `${number.format(totals.kiloWattHours)} kWh`;
  }
  renderBreakdown(totals);
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    byId("status").textContent = "Prohlížeč nepovolil uložit vstupy.";
  }
}

function prepareCopyText(totals) {
  const costs = categories
    .filter(({ optional, field }) => !optional || totals[field])
    .map(({ label, field }) => `${label}: ${currency.format(totals[field])}`);
  return [
    "Odhad nákladů na 3D tisk",
    `Série (${number.format(totals.quantity)} ks): ${currency.format(totals.batchCost)}`,
    `Za jeden kus: ${currency.format(totals.unitCost)}`,
    ...costs,
    `${number.format(totals.batchGrams)} g · ${formatDuration(totals.batchMinutes)} · ${number.format(totals.kiloWattHours)} kWh`,
  ].join("\n");
}

const gcodeInput = byId("gcode");
const gcodeStatus = byId("gcode-status");
gcodeInput.addEventListener("change", async () => {
  const [file] = gcodeInput.files;
  if (!file) return;
  gcodeInput.disabled = true;
  gcodeStatus.textContent = "Načítám údaje ze souboru…";
  try {
    const { grams, minutes } = await readGCodeMetadata(file);
    if (grams === null && minutes === null) {
      gcodeStatus.textContent = "V souboru se nepodařilo najít hmotnost ani odhad doby tisku.";
      return;
    }
    form.elements.scope.value = "batch";
    form.elements.quantity.value = "1";
    form.elements.grams.value = grams === null ? "" : number.format(grams);
    form.elements.hours.value = minutes === null ? "" : String(Math.floor(minutes / 60));
    form.elements.minutes.value = minutes === null ? "" : String(minutes % 60);

    const guidance = grams === null ? "Doplň spotřebu v gramech."
      : minutes === null ? "Doplň dobu tisku."
      : `Načteno ${number.format(grams)} g a ${formatDuration(minutes)}.`;
    gcodeStatus.textContent = `${guidance} Pokud je na podložce více kusů, uprav jejich počet.`;
    render();
  } catch (error) {
    gcodeStatus.textContent = error instanceof DOMException ? "Soubor se nepodařilo přečíst." : error.message;
  } finally {
    gcodeInput.disabled = false;
    gcodeInput.value = "";
  }
});

form.addEventListener("submit", (event) => event.preventDefault());
form.addEventListener("input", () => {
  byId("status").textContent = "";
  render();
});
byId("example").addEventListener("click", () => {
  fillForm(EXAMPLE);
  gcodeStatus.textContent = "";
  byId("status").textContent = "Ukázka načtena.";
  render();
});
document.querySelector('a[href="#vypocet"]').addEventListener("click", () => {
  byId("vypocet").open = true;
});
byId("copy").addEventListener("click", async () => {
  if (!latest) return;
  const text = prepareCopyText(latest);
  try {
    await navigator.clipboard.writeText(text);
    byId("status").textContent = "Výsledek je ve schránce.";
  } catch {
    const area = byId("copy-text");
    area.value = text;
    byId("copy-dialog").showModal();
    area.select();
  }
});

fillForm(loadSaved());
render();
