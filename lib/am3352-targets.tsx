import type { FanoutEdge } from "@tscircuit/fanout-solver"
import { Fragment } from "react"
import { AM3352_SIGNAL_CONNECTIONS } from "./am3352-buses"
import { getAm3352Pin } from "./am3352-pin-map"

export const AM3352_TARGET_EDGES = ["top", "right", "bottom", "left"] as const
// One terminal bank per natural bus edge. Each external endpoint remains independent.
export const AM3352_TARGET_PADS = AM3352_TARGET_EDGES.flatMap((edge) => {
  const pins = AM3352_SIGNAL_CONNECTIONS.filter((c) => c.targetEdge === edge)
    .map((c) => getAm3352Pin(c.pinNumber))
    .sort((a, b) => a.pinNumber - b.pinNumber)
  return pins.map((pin, index) => ({
    ...pin,
    edge,
    x: Number(((index - (pins.length - 1) / 2) * 0.5).toFixed(3)),
    y: 0,
  }))
})
export function Am3352Targets({
  edge,
  pcbRotation,
}: {
  edge: FanoutEdge
  pcbRotation: number
}) {
  return (
    <chip
      name={`J_${edge}`}
      pcbX={0}
      pcbY={0}
      pcbRotation={pcbRotation}
      footprint={
        <footprint>
          {AM3352_TARGET_PADS.filter((p) => p.edge === edge).map((p) => (
            <Fragment key={p.pinNumber}>
              <smtpad
                portHints={[`pin${p.pinNumber}`, p.name]}
                pcbX={p.x}
                pcbY={p.y}
                shape="circle"
                radius="0.2mm"
              />
            </Fragment>
          ))}
        </footprint>
      }
    />
  )
}
