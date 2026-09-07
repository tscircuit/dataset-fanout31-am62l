import { mkdir } from "node:fs/promises"
import { getAm3352TargetPlacement } from "../lib/create-am3352-fanout-sample"
import { AM3352_POWER_PLANES } from "../lib/am3352-buses"
import { AM3352_FANOUT_DIRECTION_CASES } from "../lib/am3352-fanout-directions"
import { AM3352_PAD_POSITIONS } from "../lib/am3352-footprint"
import { AM3352_TARGET_PADS, AM3352_TARGET_EDGES } from "../lib/am3352-targets"

const number = (n: number) => Number(n.toFixed(3))
const colors = [
  "#526274",
  "#dc4a31",
  "#a768be",
  "#c79820",
  "#2486b1",
  "#c35593",
]
const planeColors = new Map<number, string>(
  AM3352_POWER_PLANES.flatMap((p, i) =>
    p.pins.map((pin) => [pin, colors[i]!] as const),
  ),
)
export function generateAm3352PreviewSvg() {
  const soc = AM3352_PAD_POSITIONS.map(
    (p) =>
      `<circle cx="${number(p.x)}" cy="${number(p.y)}" r=".2" fill="${p.ballName === "A3" || p.ballName === "M5" ? "#cbd5e1" : (planeColors.get(p.pinNumber) ?? "#28976f")}"><title>${p.ballName}: ${p.name}</title></circle>`,
  ).join("")
  const targetDefinitions = AM3352_TARGET_EDGES.map(
    (edge) =>
      `<g id="terminals-${edge}">${AM3352_TARGET_PADS.filter(
        (p) => p.edge === edge,
      )
        .map(
          (p) =>
            `<circle cx="${p.x}" cy="${p.y}" r=".2" fill="#28976f"><title>${p.pinNumber}: ${p.name}</title></circle>`,
        )
        .join("")}</g>`,
  ).join("")
  const panels = AM3352_FANOUT_DIRECTION_CASES.map((direction, index) => {
    const banks = AM3352_TARGET_EDGES.map((edge) => {
      const p = getAm3352TargetPlacement(direction, edge)
      return `<g transform="translate(${p.pcbX} ${p.pcbY}) rotate(${p.pcbRotation})"><use href="#terminals-${edge}"/></g>`
    }).join("")
    const labels = AM3352_TARGET_EDGES.map((edge) => {
      const p = getAm3352TargetPlacement(direction, edge)
      const count = AM3352_TARGET_PADS.filter((p) => p.edge === edge).length
      const x =
        160 + p.pcbX * 3.4 + (p.pcbX === 25 ? 10 : p.pcbX === -25 ? -10 : 0)
      const y =
        166 - p.pcbY * 3.4 + (p.pcbY === 25 ? -7 : p.pcbY === -25 ? 14 : 4)
      const anchor = p.pcbX === 25 ? "start" : p.pcbX === -25 ? "end" : "middle"
      return `<text x="${number(x)}" y="${number(y)}" font-size="10" text-anchor="${anchor}">${count}</text>`
    }).join("")
    return `<g transform="translate(${24 + (index % 3) * 332} ${126 + Math.floor(index / 3) * 312})">
<rect width="320" height="300" rx="10" fill="white" stroke="#d9e3eb"/>
<text x="16" y="27" font-size="14" font-weight="600">${index + 61} · ${direction.name.replace("AM3352BZCZD80 · ", "")}</text>
<g transform="translate(160 166) scale(3.4 -3.4)">
<rect x="-32" y="-32" width="64" height="64" rx="1" fill="#f7fafc" stroke="#e4edf3" stroke-width=".15"/>
<rect x="-9" y="-9" width="18" height="18" fill="none" stroke="#9bb4c8" stroke-width=".2" stroke-dasharray=".6 .6"/>
<g transform="rotate(${direction.pcbRotation})"><use href="#soc"/></g>
${banks}
${[0, 90, 180, 270].map((rotation) => `<path transform="rotate(${rotation})" d="M0 11V19" fill="none" stroke="#608eac" stroke-width=".25" marker-end="url(#arrow)"/>`).join("")}
</g>${labels}
<text x="160" y="287" text-anchor="middle" font-size="10">Bus exits on all four edges · 2 mm padding</text>
</g>`
  }).join("\n")
  const legend = [
    ["#28976f", "External pin"],
    ["#cbd5e1", "NC / reserved"],
    ...AM3352_POWER_PLANES.map((p, i) => [
      colors[i]!,
      p.voltage === 0 ? "GND" : `${p.voltage} V`,
    ]),
  ]
    .map(
      ([color, label], i) =>
        `<rect x="${24 + i * 125}" y="99" width="10" height="10" fill="${color}"/><text x="${40 + i * 125}" y="108" font-size="12">${label}</text>`,
    )
    .join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1032" height="1386" viewBox="0 0 1032 1386" role="img" aria-labelledby="title description">
<title id="title">AM3352BZCZD80: twelve all-pin fanout fixtures</title>
<desc id="description">The BGA and four independent terminal banks rotate through four orientations and three band offsets. Buses break out near their source pins on all four sides. 117 supply, ground and strap connections drop to six separate planes. A3 and M5 remain unconnected. Dashed squares show SoC breakout boundaries. No solved routes are shown.</desc>
<style>text{font-family:system-ui,-apple-system,sans-serif;fill:#294052}</style>
<defs><g id="soc"><rect x="-7.5" y="-7.5" width="15" height="15" fill="#e7eef4" stroke="#506a80" stroke-width=".15"/>${soc}<circle cx="-6.4" cy="6.4" r=".2" fill="#294052"/></g>${targetDefinitions}<marker id="arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0 0L4 2L0 4" fill="none" stroke="#608eac" stroke-width=".7"/></marker></defs>
<rect width="1032" height="1386" fill="#eef3f7"/>
<text x="24" y="36" font-size="26" font-weight="700">AM3352BZCZD80 · Every non-NC pin</text>
<text x="24" y="61" font-size="14">205 external connections · 117 plane drops · 4 orientations × 3 offsets</text>
<text x="24" y="83" font-size="12">Dashed line = breakout boundary · numbers = terminal counts · arrows show direction, not solved routes</text>
${legend}${panels}
</svg>\n`
}
if (import.meta.main) {
  const directory = new URL("../docs/", import.meta.url)
  await mkdir(directory, { recursive: true })
  const output = new URL("am3352-placements.svg", directory)
  await Bun.write(output, generateAm3352PreviewSvg())
  console.log(`Wrote ${output.pathname}`)
}
