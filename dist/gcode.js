const sampleBytes = 1024 * 1024;
const weightPattern = /^;\s*(total\s+)?filament\s+(?:used|weight)\s*\[g\]\s*[:=]\s*(.+)$/i;
const totalTimePattern = /^;\s*(?:model printing time:[^;]*;\s*)?total estimated time\s*[:=]\s*(.+)$/i;
const normalTimePattern = /^;\s*estimated printing time\s*\(normal mode\)\s*=\s*(.+)$/i;
const secondsPattern = /^;\s*TIME:\s*(\d+)\s*$/i;

function parseWeight(text) {
  const fields = text.trim().split(/\s*,\s*/);
  if (fields.some((value) => !/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(value))) return null;
  const grams = fields.reduce((sum, value) => sum + Number(value), 0);
  return Number.isFinite(grams) && grams > 0 ? grams : null;
}

function parseDuration(text) {
  const parts = /^(\d+d\s*)?(\d+h\s*)?(\d+m\s*)?(\d+s)?$/i.exec(text.trim());
  if (!parts) return null;
  const units = [86400, 3600, 60, 1];
  return units.reduce((sum, unit, index) => sum + unit * (parseInt(parts[index + 1], 10) || 0), 0);
}

function validSeconds(value) {
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function parseGCodeMetadata(text) {
  let totalGrams = null;
  let toolGrams = null;
  let totalTime = null;
  let normalTime = null;
  let seconds = null;

  for (const line of text.split(/\r?\n/)) {
    const comment = line.trimStart();
    if (!comment.startsWith(";")) continue;
    const weight = weightPattern.exec(comment);
    if (weight) {
      const grams = parseWeight(weight[2]);
      if (weight[1]) totalGrams = grams ?? totalGrams;
      else toolGrams = grams ?? toolGrams;
      continue;
    }
    const total = totalTimePattern.exec(comment);
    if (total) totalTime = validSeconds(parseDuration(total[1])) ?? totalTime;
    const normal = normalTimePattern.exec(comment);
    if (normal) normalTime = validSeconds(parseDuration(normal[1])) ?? normalTime;
    const elapsed = secondsPattern.exec(comment);
    if (elapsed) seconds = validSeconds(Number(elapsed[1])) ?? seconds;
  }
  const duration = totalTime ?? normalTime ?? seconds;
  return {
    grams: totalGrams ?? toolGrams,
    minutes: duration === null ? null : Math.ceil(duration / 60),
  };
}

export async function readGCodeMetadata(file) {
  if (!/\.(?:gcode|gco|g)$/i.test(file.name)) {
    throw Error("Vyber textový G-code (.gcode, .gco nebo .g).");
  }
  const wholeFile = file.size <= 2 * sampleBytes;
  const head = await (wholeFile ? file : file.slice(0, sampleBytes)).text();
  if (head.includes("\0")) throw Error("Vyber textový G-code. Binární soubor se nedá načíst.");
  if (wholeFile) return parseGCodeMetadata(head);

  const tail = await file.slice(-sampleBytes).text();
  const firstEnd = head.lastIndexOf("\n") + 1;
  const lastStart = tail.indexOf("\n");
  const completeTail = lastStart < 0 ? "" : tail.slice(lastStart + 1);
  return parseGCodeMetadata(head.slice(0, firstEnd) + completeTail);
}
