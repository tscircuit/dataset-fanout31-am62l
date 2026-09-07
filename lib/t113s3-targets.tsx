import { Fragment } from "react"
import { T113S3_SIGNAL_PINS } from "./t113s3-buses"

// Two rows of 53 individual destination pads, 0.8 mm pitch. These are fixture
// terminals, not an external RAM chip (T113-S3 has RAM inside the package).
export const T113S3_TARGET_PADS = T113S3_SIGNAL_PINS.map((pin, index) => ({
  ...pin,
  x: Number((((index % 53) - 26) * 0.8).toFixed(3)),
  y: Math.floor(index / 53) === 0 ? 0.8 : -0.8,
}))
export function T113s3Targets({ pcbRotation }: { pcbRotation: number }) {
  return (
    <chip
      name="J1"
      pcbX={0}
      pcbY={0}
      pcbRotation={pcbRotation}
      footprint={
        <footprint>
          {T113S3_TARGET_PADS.map((p) => (
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
