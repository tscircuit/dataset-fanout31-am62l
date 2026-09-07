import { mkdir } from "node:fs/promises"
import { getImx6ullMemoryPlacement } from "../lib/create-imx6ull-fanout-sample"
import {
  DDR3L_PAD_DIAMETER,
  DDR3L_PAD_POSITIONS,
  DDR3L_SIGNAL_BALLS,
} from "../lib/ddr3l-footprint"
import { IMX6ULL_DDR_SIGNAL_BALL_MAP } from "../lib/imx6ull-ball-map"
import { IMX6ULL_FANOUT_DIRECTION_CASES } from "../lib/imx6ull-fanout-directions"
import { IMX6ULL_PAD_POSITIONS } from "../lib/imx6ull-footprint"

const escapeXml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
const number = (value: number) => Number(value.toFixed(3))
const memorySignals = new Set<string>(Object.values(DDR3L_SIGNAL_BALLS))

const drawPads = (
  positions: readonly { ballName: string; x: number; y: number }[],
  radius: number,
  isSignal: (ballName: string) => boolean,
) =>
  positions
    .map(
      ({ ballName, x, y }) =>
        `<circle cx="${number(x)}" cy="${number(y)}" r="${radius}"${isSignal(ballName) ? ' class="signal"' : ""}/>`,
    )
    .join("")

export function generateImx6ullPreviewSvg(): string {
  const width = 1032
  const margin = 24
  const gap = 12
  const panelWidth = 320
  const panelHeight = 272
  const startY = 106
  const scale = 4.1
  const originX = panelWidth / 2
  const originY = 154
  const rowCount = Math.ceil(IMX6ULL_FANOUT_DIRECTION_CASES.length / 3)
  const height = startY + rowCount * (panelHeight + gap) - gap + margin

  const panels = IMX6ULL_FANOUT_DIRECTION_CASES.map((directionCase, index) => {
    const placement = getImx6ullMemoryPlacement(directionCase)
    const x = margin + (index % 3) * (panelWidth + gap)
    const y = startY + Math.floor(index / 3) * (panelHeight + gap)
    const label = `${directionCase.id.split("-")[0]}  ${directionCase.name.replace("IMX6ULL · ", "")}`
    const memoryHalfHeight = placement.pcbRotation % 180 === 0 ? 6.65 : 3.75
    return `<g transform="translate(${x} ${y})">
<rect width="${panelWidth}" height="${panelHeight}" rx="10" class="panel"/>
<text x="16" y="27" class="panel-title">${escapeXml(label)}</text>
<g transform="translate(${originX} ${originY}) scale(${scale} -${scale})">
<rect x="-26" y="-26" width="52" height="52" rx="0.7" class="board"/>
<use href="#soc"/>
<g transform="translate(${placement.pcbX} ${placement.pcbY}) rotate(${placement.pcbRotation})"><use href="#memory"/></g>
</g>
<text x="${originX}" y="${number(originY + 8.8 * scale)}" class="chip-label">IMX6ULL</text>
<text x="${number(originX + placement.pcbX * scale)}" y="${number(originY - (placement.pcbY + memoryHalfHeight + 1.7) * scale)}" class="chip-label">DDR3L</text>
</g>`
  }).join("\n")

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
<title id="title">Twelve IMX6ULL to DDR3L package placements</title>
<desc id="description">Each panel keeps the 289-ball NXP IMX6ULL fixed and moves the 96-ball Samsung DDR3L package to a different edge or offset. Orange pads mark the 49 DDR interface signals on each chip. Positions and RAM rotations come from the sample source. No routes are shown.</desc>
<style>
text{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;fill:#24394d}
.title{font-size:26px;font-weight:700}.subtitle{font-size:14px;fill:#526b80}.caption{font-size:13px;fill:#526b80}
.panel{fill:#fff;stroke:#d9e3eb}.panel-title{font-size:15px;font-weight:600}.chip-label{font-size:10px;fill:#426178;text-anchor:middle}
.board{fill:#f7fafc;stroke:#e4edf3;stroke-width:.15}.package{fill:#e9f0f5;stroke:#49657b;stroke-width:.15}
.pads{fill:#8195a6}.signal{fill:#e66c19}.pin-one{fill:none;stroke:#49657b;stroke-width:.15}
</style>
<defs>
<g id="soc"><rect x="-7" y="-7" width="14" height="14" class="package"/>
<path d="M-7 5.8V7H-5.8" class="pin-one"/>
<g class="pads">${drawPads(IMX6ULL_PAD_POSITIONS, 0.2, (ballName) => ballName in IMX6ULL_DDR_SIGNAL_BALL_MAP)}</g></g>
<g id="memory"><rect x="-3.75" y="-6.65" width="7.5" height="13.3" class="package"/>
<circle cx="-3.45" cy="6.35" r=".12" class="pin-one"/>
<g class="pads">${drawPads(DDR3L_PAD_POSITIONS, DDR3L_PAD_DIAMETER / 2, (ballName) => memorySignals.has(ballName))}</g></g>
</defs>
<rect width="${width}" height="${height}" fill="#eef3f7"/>
<text x="24" y="36" class="title">IMX6ULL → DDR3L</text>
<text x="24" y="60" class="subtitle">289-ball NXP SoC · 96-ball ×16 RAM · 12 physical placements</text>
<text x="24" y="84" class="caption">Package placement preview · routes not shown</text>
<circle cx="625" cy="80" r="4" class="signal"/><text x="637" y="84" class="caption">DDR signal pads</text>
<circle cx="814" cy="80" r="4" fill="#8195a6"/><text x="826" y="84" class="caption">Other populated pads</text>
${panels}
</svg>\n`
}

if (import.meta.main) {
  const directory = new URL("../docs/", import.meta.url)
  await mkdir(directory, { recursive: true })
  const output = new URL("imx6ull-placements.svg", directory)
  await Bun.write(output, generateImx6ullPreviewSvg())
  console.log(`Wrote ${output.pathname}`)
}
