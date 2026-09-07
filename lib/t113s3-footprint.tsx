import { Fragment } from "react"
import { T113S3_PINS } from "./t113s3-pin-map"

// Allwinner v1.6 Figure 7-2: 14 mm body, 16 mm lead-tip span, 0.4 mm
// pitch; the caution explicitly selects the 5.72 x 5.72 mm exposed pad.
// Peripheral copper lands (1.50 x 0.20 mm at +/-7.70 mm) are fixture choices.
// Top view: pin 1 upper left, numbering counterclockwise.
export const T113S3_PAD_POSITIONS = T113S3_PINS.map((pin) => {
  if (pin.pinNumber === 129)
    return { ...pin, x: 0, y: 0, width: 5.72, height: 5.72 }
  const side = Math.floor((pin.pinNumber - 1) / 32)
  const along = Number((6.2 - ((pin.pinNumber - 1) % 32) * 0.4).toFixed(3))
  const positions = [
    { x: -7.7, y: along, width: 1.5, height: 0.2 },
    { x: -along, y: -7.7, width: 0.2, height: 1.5 },
    { x: 7.7, y: -along, width: 1.5, height: 0.2 },
    { x: along, y: 7.7, width: 0.2, height: 1.5 },
  ]
  return { ...pin, ...positions[side]! }
})

export function T113s3({ pcbRotation = 0 }: { pcbRotation?: number }) {
  return (
    <chip
      name="U1"
      manufacturerPartNumber="T113-S3"
      pcbX={0}
      pcbY={0}
      pcbRotation={pcbRotation}
      footprint={
        <footprint>
          {T113S3_PAD_POSITIONS.map((p) => (
            <Fragment key={p.pinNumber}>
              <smtpad
                portHints={[`pin${p.pinNumber}`, p.name]}
                pcbX={p.x}
                pcbY={p.y}
                width={p.width}
                height={p.height}
                shape="rect"
                solderMaskMargin="0.0254mm"
              />
            </Fragment>
          ))}
          <silkscreenpath
            route={[
              { x: -7, y: 6.5 },
              { x: -6.5, y: 7 },
              { x: 7, y: 7 },
              { x: 7, y: -7 },
              { x: -7, y: -7 },
              { x: -7, y: 6.5 },
            ]}
          />
          <silkscreencircle pcbX={-6.4} pcbY={6.4} radius="0.2mm" />
          <silkscreentext
            text="{NAME}"
            pcbX={0}
            pcbY={9}
            fontSize={0.8}
            anchorAlignment="center"
          />
          <courtyardoutline
            outline={[
              { x: -8.7, y: 8.7 },
              { x: 8.7, y: 8.7 },
              { x: 8.7, y: -8.7 },
              { x: -8.7, y: -8.7 },
              { x: -8.7, y: 8.7 },
            ]}
          />
        </footprint>
      }
    />
  )
}
