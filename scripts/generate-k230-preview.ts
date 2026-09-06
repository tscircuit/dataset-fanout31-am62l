import { mkdir } from "node:fs/promises"
import { getK230MemoryPlacements } from "../lib/create-k230-fanout-sample"
import { K230_SIGNAL_CONNECTIONS } from "../lib/k230-buses"
import { K230_FANOUT_DIRECTION_CASES } from "../lib/k230-fanout-directions"
import { K230_PAD_POSITIONS } from "../lib/k230-footprint"
import {
  K230_LPDDR4_PAD_POSITIONS,
  K230_LPDDR4_SIGNAL_BALLS,
} from "../lib/k230-lpddr4-footprint"

const number = (value: number) => Number(value.toFixed(3))
const escapeXml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
const signalBalls = new Set(
  K230_SIGNAL_CONNECTIONS.map((connection) => connection.socBall),
)
const ramSignalBalls = new Set<string>(Object.values(K230_LPDDR4_SIGNAL_BALLS))
const pads = (
  positions: readonly { ballName: string; x: number; y: number }[],
  radius: number,
  signals: Set<string>,
) =>
  positions
    .map(
      (pad) =>
        `<circle cx="${number(pad.x)}" cy="${number(pad.y)}" r="${radius}"${signals.has(pad.ballName) ? ' class="signal"' : ""}/>`,
    )
    .join("")

export function generateK230PreviewSvg(): string {
  const margin = 24,
    gap = 12,
    panelWidth = 392,
    panelHeight = 384,
    startY = 110
  const width = 1248,
    height = 1706,
    scale = 4.3,
    originX = 196,
    originY = 207
  const panels = K230_FANOUT_DIRECTION_CASES.map((directionCase, index) => {
    const memories = getK230MemoryPlacements(directionCase)
    const x = margin + (index % 3) * (panelWidth + gap)
    const y = startY + Math.floor(index / 3) * (panelHeight + gap)
    return `<g transform="translate(${x} ${y})">
<rect width="${panelWidth}" height="${panelHeight}" rx="10" class="panel"/>
<text x="16" y="27" class="panel-title">${directionCase.id.split("-")[0]} · ${escapeXml(directionCase.name.replace("K230 · ", ""))}</text>
<g transform="translate(${originX} ${originY}) scale(${scale} -${scale})">
<rect x="-36" y="-36" width="72" height="72" rx="0.7" class="board"/>
<use href="#soc"/>
${memories.map((memory) => `<g transform="translate(${memory.pcbX} ${memory.pcbY}) rotate(${memory.pcbRotation})"><use href="#memory"/></g>`).join("\n")}
</g>
<text x="${originX}" y="${number(originY + 8.8 * scale)}" class="chip-label">K230</text>
${memories.map((memory) => `<text x="${number(originX + memory.pcbX * scale)}" y="${number(originY - (memory.pcbY + (memory.pcbRotation === 90 ? 5 : 7.25) + 1.7) * scale)}" class="chip-label">LPDDR4 ${memory.channel}</text>`).join("\n")}
</g>`
  }).join("\n")
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
<title id="title">Twelve K230 to dual x16 LPDDR4 placements</title>
<desc id="description">The 390-ball Canaan K230 stays fixed. Two 200-ball Micron x16 memories move together to each of four sides and three offsets. All 790 physical pads are shown. Orange pads carry 65 SoC signals and 33 signals on each RAM, including shared reset. Placement preview only; routes are not shown.</desc>
<style>
text{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;fill:#24394d}
.title{font-size:26px;font-weight:700}.subtitle{font-size:14px;fill:#526b80}.caption{font-size:13px;fill:#526b80}
.panel{fill:#fff;stroke:#d9e3eb}.panel-title{font-size:15px;font-weight:600}.chip-label{font-size:10px;fill:#426178;text-anchor:middle}
.board{fill:#f7fafc;stroke:#e4edf3;stroke-width:.15}.package{fill:#e9f0f5;stroke:#49657b;stroke-width:.15}
.pads{fill:#8195a6}.signal{fill:#e66c19}.pin-one{fill:none;stroke:#49657b;stroke-width:.15}
</style>
<defs>
<g id="soc"><rect x="-6.5" y="-6.5" width="13" height="13" class="package"/>
<path d="M-6.5 5.3V6.5H-5.3" class="pin-one"/><g class="pads">${pads(K230_PAD_POSITIONS, 0.15, signalBalls)}</g></g>
<g id="memory"><rect x="-5" y="-7.25" width="10" height="14.5" class="package"/>
<circle cx="-4.65" cy="6.95" r=".12" class="pin-one"/><g class="pads">${pads(K230_LPDDR4_PAD_POSITIONS, 0.2, ramSignalBalls)}</g></g>
</defs>
<rect width="${width}" height="${height}" fill="#eef3f7"/>
<text x="24" y="36" class="title">K230 → dual x16 LPDDR4</text>
<text x="24" y="60" class="subtitle">390-ball NPU SoC · two 200-ball single-rank RAMs · 12 physical placements</text>
<text x="24" y="84" class="caption">Package placement preview · routes not shown</text>
<circle cx="765" cy="80" r="4" class="signal"/><text x="777" y="84" class="caption">LPDDR4 signals</text>
<circle cx="960" cy="80" r="4" fill="#8195a6"/><text x="972" y="84" class="caption">Other populated pads</text>
${panels}
</svg>\n`
}

if (import.meta.main) {
  const directory = new URL("../docs/", import.meta.url)
  await mkdir(directory, { recursive: true })
  await Bun.write(
    new URL("k230-placements.svg", directory),
    generateK230PreviewSvg(),
  )
}
