import { Fragment } from "react"
import {
  RK3308_BALL_MAP,
  RK3308_BALL_PITCH,
  RK3308_ROW_NAMES,
} from "./rk3308-ball-map"

/**
 * Top PCB view: A1 is at the upper left, columns increase to the right,
 * and rows increase downwards. This vertically mirrors the package bottom
 * view in datasheet Fig. 2-3 (p. 17), where A1 is at the lower left.
 * Numeric tscircuit pins count populated balls in row-major order.
 */
export const RK3308_PAD_POSITIONS = (() => {
  let pinNumber = 0
  return RK3308_ROW_NAMES.flatMap((rowName, rowIndex) =>
    Array.from({ length: 20 }, (_, columnIndex) => {
      const ballName = `${rowName}${columnIndex + 1}`
      const signalName = RK3308_BALL_MAP[ballName]
      if (signalName === undefined) return []
      pinNumber += 1
      return [
        {
          ballName,
          signalName,
          pinNumber,
          x: Number(((columnIndex - 9.5) * RK3308_BALL_PITCH).toFixed(3)),
          y: Number(((9.5 - rowIndex) * RK3308_BALL_PITCH).toFixed(3)),
        },
      ]
    }).flat(),
  )
})()

const RK3308_PIN_NUMBER_BY_BALL = new Map(
  RK3308_PAD_POSITIONS.map(({ ballName, pinNumber }) => [ballName, pinNumber]),
)

export function getRk3308PinNumber(ballName: string): number {
  const pinNumber = RK3308_PIN_NUMBER_BY_BALL.get(ballName)
  if (pinNumber === undefined) {
    throw new Error(`RK3308 fixture does not contain ball ${ballName}`)
  }
  return pinNumber
}

export function Rk3308() {
  return (
    <chip
      name="U1"
      manufacturerPartNumber="RK3308"
      pcbX={0}
      pcbY={0}
      footprint={
        <footprint>
          {RK3308_PAD_POSITIONS.map(({ ballName, pinNumber, x, y }) => (
            <Fragment key={`rk3308-pad-${pinNumber}`}>
              <smtpad
                portHints={[`pin${pinNumber}`, ballName]}
                pcbX={x}
                pcbY={y}
                radius="0.15mm"
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
