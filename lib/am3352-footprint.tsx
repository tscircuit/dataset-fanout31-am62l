import { Fragment } from "react"
import { AM3352_PINS } from "./am3352-pin-map"
/** Top PCB view, A1 upper left. Circular 0.4 mm lands are a fixture choice.
 * Body is 15 mm square; rotated as a whole for each scenario. */
export const AM3352_PAD_POSITIONS = AM3352_PINS
export function Am3352({ pcbRotation = 0 }: { pcbRotation?: number }) {
  return (
    <chip
      name="U1"
      manufacturerPartNumber="AM3352BZCZD80"
      pcbX={0}
      pcbY={0}
      pcbRotation={pcbRotation}
      footprint={
        <footprint>
          {AM3352_PINS.map((p) => (
            <Fragment key={p.pinNumber}>
              <smtpad
                portHints={[`pin${p.pinNumber}`, p.ballName]}
                pcbX={p.x}
                pcbY={p.y}
                radius="0.2mm"
                shape="circle"
              />
            </Fragment>
          ))}
          <silkscreenpath
            route={[
              { x: -7.5, y: 7.5 },
              { x: 7.5, y: 7.5 },
              { x: 7.5, y: -7.5 },
              { x: -7.5, y: -7.5 },
              { x: -7.5, y: 7.5 },
            ]}
          />
          <silkscreencircle pcbX={-7.8} pcbY={7.0} radius="0.2mm" />
        </footprint>
      }
    />
  )
}
