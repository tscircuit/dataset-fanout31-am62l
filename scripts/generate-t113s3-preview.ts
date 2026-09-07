import { mkdir } from "node:fs/promises"
import { getT113s3TargetPlacement } from "../lib/create-t113s3-fanout-sample"
import { T113S3_POWER_PLANES } from "../lib/t113s3-buses"
import { T113S3_FANOUT_DIRECTION_CASES } from "../lib/t113s3-fanout-directions"
import { T113S3_PAD_POSITIONS } from "../lib/t113s3-footprint"
import { T113S3_TARGET_PADS } from "../lib/t113s3-targets"

const number = (n: number) => Number(n.toFixed(3))
const colors = ["#526274", "#dc4a31", "#a768be", "#c79820", "#2486b1"]
const planeColors = new Map<number, string>(
  T113S3_POWER_PLANES.flatMap((p, i) =>
    p.pins.map((pin) => [pin, colors[i]!] as const),
  ),
)
export function generateT113s3PreviewSvg() {
  const soc = T113S3_PAD_POSITIONS.map(
    (p) =>
      `<rect x="${number(p.x - p.width / 2)}" y="${number(p.y - p.height / 2)}" width="${p.width}" height="${p.height}" fill="${p.pinNumber === 106 ? "#cbd5e1" : (planeColors.get(p.pinNumber) ?? "#28976f")}"><title>${p.pinNumber}: ${p.name}</title></rect>`,
  ).join("")
  const targets = T113S3_TARGET_PADS.map(
    (p) =>
      `<circle cx="${p.x}" cy="${p.y}" r=".2" fill="#28976f"><title>${p.pinNumber}: ${p.name}</title></circle>`,
  ).join("")
  const panels = T113S3_FANOUT_DIRECTION_CASES.map((direction, index) => {
    const p = getT113s3TargetPlacement(direction)
    const label = direction.name.replace("T113-S3 · ", "")
    const targetLabelY =
      166 - p.pcbY * 2.15 + (p.pcbRotation === 90 ? 21 : 1) * 2.15 + 13
    return `<g transform="translate(${24 + (index % 3) * 332} ${126 + Math.floor(index / 3) * 312})">
<rect width="320" height="300" rx="10" fill="white" stroke="#d9e3eb"/>
<text x="16" y="27" font-size="15" font-weight="600">${index + 49} ${label}</text>
<g transform="translate(160 166) scale(2.15 -2.15)">
<rect x="-56" y="-56" width="112" height="112" rx="1" fill="#f7fafc" stroke="#e4edf3" stroke-width=".15"/>
<rect x="-22.45" y="-22.45" width="44.9" height="44.9" fill="none" stroke="#9bb4c8" stroke-width=".25" stroke-dasharray="1 1"/>
<use href="#soc"/>
<g transform="translate(${p.pcbX} ${p.pcbY}) rotate(${p.pcbRotation})"><use href="#terminals"/></g>
</g>
<text x="160" y="195" text-anchor="middle" font-size="10">T113-S3</text>
<text x="${number(160 + p.pcbX * 2.15)}" y="${number(targetLabelY)}" text-anchor="middle" font-size="10">106 terminals</text>
</g>`
  }).join("\n")
  const legend = [
    ["#28976f", "External pin"],
    ["#cbd5e1", "NC (106)"],
    ...T113S3_POWER_PLANES.map((p, i) => [
      colors[i]!,
      p.voltage === 0 ? "GND" : `${p.voltage} V`,
    ]),
  ]
    .map(
      ([color, label], i) =>
        `<rect x="${24 + i * 141}" y="99" width="10" height="10" fill="${color}"/><text x="${40 + i * 141}" y="108" font-size="12">${label}</text>`,
    )
    .join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1032" height="1386" viewBox="0 0 1032 1386" role="img" aria-labelledby="title description">
<title id="title">T113-S3: twelve all-pin fanout fixtures</title>
<desc id="description">The 128-lead QFP and its exposed ground pad stay fixed. 106 independent external terminals move to each side and offset. Twenty supply pins and both ground pads drop to five separate plane layers. Pin 106 is NC. Dashed squares show SoC breakout boundaries. No solved routes are shown.</desc>
<style>text{font-family:system-ui,-apple-system,sans-serif;fill:#294052}</style>
<defs><g id="soc"><rect x="-7" y="-7" width="14" height="14" fill="#e7eef4" stroke="#506a80" stroke-width=".15"/>${soc}<circle cx="-6.4" cy="6.4" r=".2" fill="#294052"/></g><g id="terminals">${targets}</g></defs>
<rect width="1032" height="1386" fill="#eef3f7"/>
<text x="24" y="36" font-size="26" font-weight="700">T113-S3 · Every non-NC pin</text>
<text x="24" y="61" font-size="14">106 external connections · 22 plane drops · 12 directional placements</text>
<text x="24" y="83" font-size="12">Placement overview · dashed line = SoC breakout boundary · routes not shown</text>
${legend}${panels}
</svg>\n`
}
if (import.meta.main) {
  const directory = new URL("../docs/", import.meta.url)
  await mkdir(directory, { recursive: true })
  const output = new URL("t113s3-placements.svg", directory)
  await Bun.write(output, generateT113s3PreviewSvg())
  console.log(`Wrote ${output.pathname}`)
}
