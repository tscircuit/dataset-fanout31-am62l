import type { FanoutEdge } from "@tscircuit/fanout-solver"
import { Fragment } from "react"
import { T113S3_SIGNAL_CONNECTIONS } from "./t113s3-buses"
import { getT113s3Pin } from "./t113s3-pin-map"

export const T113S3_TARGET_EDGES = ["top", "right", "bottom", "left"] as const
// One terminal bank per natural bus edge. All 106 endpoints remain independent.
export const T113S3_TARGET_PADS = T113S3_TARGET_EDGES.flatMap((edge) => {
  const pins = T113S3_SIGNAL_CONNECTIONS.filter((c) => c.targetEdge === edge)
    .map((c) => getT113s3Pin(c.pinNumber))
    .sort((a, b) => a.pinNumber - b.pinNumber)
  return pins.map((pin, index) => ({
    ...pin,
    edge,
    x: Number(((index - (pins.length - 1) / 2) * 0.5).toFixed(3)),
    y: 0,
  }))
})
export function T113s3Targets({
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
          {T113S3_TARGET_PADS.filter((p) => p.edge === edge).map((p) => (
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
