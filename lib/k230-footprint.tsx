import { Fragment } from "react"
import { K230_BALL_MAP, K230_BALL_PITCH, K230_ROW_NAMES } from "./k230-ball-map"

/**
 * Dataset copper-land choice, not a manufacturer PCB land recommendation.
 * The vendor's nominal solder-ball diameter also happens to be 0.30 mm.
 * The solder-mask expansion and courtyard are fixture choices as well.
 */
export const K230_COPPER_LAND_DIAMETER = 0.3

/**
 * Manufacturer top view: column 1 is at the left and row A is at the top.
 * Coordinates use +Y upwards; A1 is an unpopulated position in this package.
 * Numeric tscircuit pins count only occupied balls in row-major order.
 */
export const K230_PAD_POSITIONS = (() => {
  let pinNumber = 0
  return K230_ROW_NAMES.flatMap((rowName, rowIndex) =>
    Array.from({ length: 20 }, (_, columnIndex) => {
      const ballName = `${rowName}${columnIndex + 1}`
      const signalName = K230_BALL_MAP[ballName]
      if (signalName === undefined) return []
      pinNumber += 1
      return [
        {
          ballName,
          signalName,
          pinNumber,
          x: Number(((columnIndex - 9.5) * K230_BALL_PITCH).toFixed(3)),
          y: Number(((9.5 - rowIndex) * K230_BALL_PITCH).toFixed(3)),
        },
      ]
    }).flat(),
  )
})()

const K230_PIN_NUMBER_BY_BALL = new Map(
  K230_PAD_POSITIONS.map(({ ballName, pinNumber }) => [ballName, pinNumber]),
)

export function getK230PinNumber(ballName: string): number {
  const pinNumber = K230_PIN_NUMBER_BY_BALL.get(ballName)
  if (pinNumber === undefined) {
    throw new Error(`K230 fixture does not contain ball ${ballName}`)
  }
  return pinNumber
}

export function K230() {
  return (
    <chip
      name="U1"
      manufacturerPartNumber="K230"
      pcbX={0}
      pcbY={0}
      footprint={
        <footprint>
          {K230_PAD_POSITIONS.map(({ ballName, pinNumber, x, y }) => (
            <Fragment key={`k230-pad-${pinNumber}`}>
              <smtpad
                portHints={[`pin${pinNumber}`, ballName]}
                pcbX={x}
                pcbY={y}
                radius={K230_COPPER_LAND_DIAMETER / 2}
                solderMaskMargin="0.0254mm"
                shape="circle"
              />
            </Fragment>
          ))}
          <silkscreenpath
            route={[
              { x: -6.5, y: 6.5 },
              { x: 6.5, y: 6.5 },
              { x: 6.5, y: -6.5 },
              { x: -6.5, y: -6.5 },
              { x: -6.5, y: 6.5 },
            ]}
          />
          <silkscreencircle pcbX={-6.9} pcbY={6.175} radius="0.15mm" />
          <silkscreentext
            text="{NAME}"
            pcbX="0mm"
            pcbY="7.2mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -6.75, y: 6.75 },
              { x: 6.75, y: 6.75 },
              { x: 6.75, y: -6.75 },
              { x: -6.75, y: -6.75 },
              { x: -6.75, y: 6.75 },
            ]}
          />
        </footprint>
      }
    />
  )
}
