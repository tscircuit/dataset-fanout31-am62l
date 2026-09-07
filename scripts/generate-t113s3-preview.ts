import { mkdir } from "node:fs/promises"
import { getT113s3TargetPlacement } from "../lib/create-t113s3-fanout-sample"
import { T113S3_POWER_PLANES } from "../lib/t113s3-buses"
import { T113S3_FANOUT_DIRECTION_CASES } from "../lib/t113s3-fanout-directions"
import { T113S3_PAD_POSITIONS } from "../lib/t113s3-footprint"
import { T113S3_TARGET_PADS, T113S3_TARGET_EDGES } from "../lib/t113s3-targets"

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
  const targetDefinitions = T113S3_TARGET_EDGES.map(
    (edge) =>
      `<g id="terminals-${edge}">${T113S3_TARGET_PADS.filter(
        (p) => p.edge === edge,
      )
        .map(
          (p) =>
            `<circle cx="${p.x}" cy="${p.y}" r=".2" fill="#28976f"><title>${p.pinNumber}: ${p.name}</title></circle>`,
        )
        .join("")}</g>`,
  ).join("")
  const panels = T113S3_FANOUT_DIRECTION_CASES.map((direction, index) => {
    const banks = T113S3_TARGET_EDGES.map((edge) => {
      const p = getT113s3TargetPlacement(direction, edge)
      return `<g transform="translate(${p.pcbX} ${p.pcbY}) rotate(${p.pcbRotation})"><use href="#terminals-${edge}"/></g>`
    }).join("")
    const labels = T113S3_TARGET_EDGES.map((edge) => {
      const p = getT113s3TargetPlacement(direction, edge)
      const count = T113S3_TARGET_PADS.filter((p) => p.edge === edge).length
      const x =
        160 + p.pcbX * 4.4 + (p.pcbX === 18 ? 10 : p.pcbX === -18 ? -10 : 0)
      const y =
        166 - p.pcbY * 4.4 + (p.pcbY === 18 ? -7 : p.pcbY === -18 ? 14 : 4)
      const anchor = p.pcbX === 18 ? "start" : p.pcbX === -18 ? "end" : "middle"
      return `<text x="${number(x)}" y="${number(y)}" font-size="10" text-anchor="${anchor}">${count}</text>`
    }).join("")
    return `<g transform="translate(${24 + (index % 3) * 332} ${126 + Math.floor(index / 3) * 312})">
<rect width="320" height="300" rx="10" fill="white" stroke="#d9e3eb"/>
<text x="16" y="27" font-size="14" font-weight="600">${index + 49} · ${direction.name.replace("T113-S3 · ", "")}</text>
<g transform="translate(160 166) scale(4.4 -4.4)">
<rect x="-24" y="-24" width="48" height="48" rx="1" fill="#f7fafc" stroke="#e4edf3" stroke-width=".15"/>
<rect x="-10.45" y="-10.45" width="20.9" height="20.9" fill="none" stroke="#9bb4c8" stroke-width=".2" stroke-dasharray=".6 .6"/>
<g transform="rotate(${direction.pcbRotation})"><use href="#soc"/></g>
${banks}
${[0, 90, 180, 270].map((rotation) => `<path transform="rotate(${rotation})" d="M0 12V15" fill="none" stroke="#608eac" stroke-width=".25" marker-end="url(#arrow)"/>`).join("")}
</g>${labels}
<text x="160" y="287" text-anchor="middle" font-size="10">Bus exits on all four edges · 2 mm padding</text>
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
<desc id="description">The QFP and four independent terminal banks rotate through four orientations and three band offsets. Buses break out near their source pins on all four sides. Twenty supply pins and both ground pads drop to five separate plane layers. Pin 106 is NC. Dashed squares show SoC breakout boundaries. No solved routes are shown.</desc>
<style>text{font-family:system-ui,-apple-system,sans-serif;fill:#294052}</style>
<defs><g id="soc"><rect x="-7" y="-7" width="14" height="14" fill="#e7eef4" stroke="#506a80" stroke-width=".15"/>${soc}<circle cx="-6.4" cy="6.4" r=".2" fill="#294052"/></g>${targetDefinitions}<marker id="arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0 0L4 2L0 4" fill="none" stroke="#608eac" stroke-width=".7"/></marker></defs>
<rect width="1032" height="1386" fill="#eef3f7"/>
<text x="24" y="36" font-size="26" font-weight="700">T113-S3 · Every non-NC pin</text>
<text x="24" y="61" font-size="14">106 external connections · 22 plane drops · 4 orientations × 3 offsets</text>
<text x="24" y="83" font-size="12">Dashed line = breakout boundary · numbers = terminal counts · arrows show direction, not solved routes</text>
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
