import assert from "node:assert/strict";
import test from "node:test";
import { parseGCodeMetadata, readGCodeMetadata } from "../dist/gcode.js";

test("reads normal mode and adds weights for the different filaments", () => {
  const data = [
    "G28 ; filament used [g] = 100",
    "; filament used [g] = 12.75, 0, 9.5",
    "; estimated printing time (normal mode) = 1h 35m 12s",
    "; estimated printing time (silent mode) = 4h",
  ].join("\r\n");
  assert.deepEqual(parseGCodeMetadata(data), { grams: 22.25, minutes: 96 });
});

test("prefers whole-job metadata over model time and other weight estimates", () => {
  const data = [
    "; model printing time: 45m 2s; total estimated time: 51m 14s",
    "; total filament weight [g] : 10.5, 25.25",
    "; filament used [g] = 3",
    "; estimated printing time (normal mode) = 1d 3h",
  ].join("\n");
  assert.deepEqual(parseGCodeMetadata(data), { grams: 35.75, minutes: 52 });
});

test("reads Cura time and leaves meter-only filament figures unset", () => {
  const data = ";TIME:3600\n;Filament used: 2.1m, 1.2m\n;TIME_ELAPSED:1.2";
  assert.deepEqual(parseGCodeMetadata(data), { grams: null, minutes: 60 });
});

test("ignores malformed and unrelated values", () => {
  const data = [
    "; total filament used [g] = 8.12",
    "; total filament used [g] = 10,",
    "; estimated printing time (normal mode) = 2h broken",
    ";TIME:0",
    "M73 P3 R999",
  ].join("\n");
  assert.deepEqual(parseGCodeMetadata(data), { grams: 8.12, minutes: null });
  assert.deepEqual(parseGCodeMetadata("G28"), { grams: null, minutes: null });
});

test("reads the header and footer of a large file", async () => {
  const file = new File([
    ";TIME:5400\n",
    "G1 X90\n".repeat(400_000),
    "; total filament used [g] = 112.5",
  ], "test.GCODE");
  assert.deepEqual(await readGCodeMetadata(file), { grams: 112.5, minutes: 90 });
});

test("rejects binary and compressed G-code exports", async () => {
  await assert.rejects(readGCodeMetadata(new File(["\0file"], "test.gcode")), /Binární/);
  await assert.rejects(readGCodeMetadata(new File(["dummy"], "test.bgcode")), /textový G-code/);
});
