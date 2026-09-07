import { Fragment } from "react"
import {
  IMX6ULL_BALL_MAP,
  IMX6ULL_BALL_PITCH,
  IMX6ULL_ROW_NAMES,
} from "./imx6ull-ball-map"

/**
 * Top PCB view: A1 is at the upper left, columns increase to the right,
 * and rows increase downwards. This follows Table 92 and the
 * top-view orientation of NXP Figure 70. Lands are a dataset choice (0.40 mm).
 * Numeric tscircuit pins count populated balls in row-major order.
 */
export const IMX6ULL_PAD_POSITIONS = (() => {
  let pinNumber = 0
  return IMX6ULL_ROW_NAMES.flatMap((rowName, rowIndex) =>
    Array.from({ length: 17 }, (_, columnIndex) => {
      const ballName = `${rowName}${columnIndex + 1}`
      const signalName = IMX6ULL_BALL_MAP[ballName]
      if (signalName === undefined) return []
      pinNumber += 1
      return [
        {
          ballName,
          signalName,
          pinNumber,
          x: Number(((columnIndex - 8) * IMX6ULL_BALL_PITCH).toFixed(3)),
          y: Number(((8 - rowIndex) * IMX6ULL_BALL_PITCH).toFixed(3)),
        },
      ]
    }).flat(),
  )
})()

const IMX6ULL_PIN_NUMBER_BY_BALL = new Map(
  IMX6ULL_PAD_POSITIONS.map(({ ballName, pinNumber }) => [ballName, pinNumber]),
)

export function getImx6ullPinNumber(ballName: string): number {
  const pinNumber = IMX6ULL_PIN_NUMBER_BY_BALL.get(ballName)
  if (pinNumber === undefined) {
    throw new Error(`IMX6ULL fixture does not contain ball ${ballName}`)
  }
  return pinNumber
}

export function Imx6ull() {
  return (
    <chip
      name="U1"
      manufacturerPartNumber="MCIMX6Y2CVM08AB"
      pcbX={0}
      pcbY={0}
      footprint={
        <footprint>
          {IMX6ULL_PAD_POSITIONS.map(({ ballName, pinNumber, x, y }) => (
            <Fragment key={`imx6ull-pad-${pinNumber}`}>
              <smtpad
                portHints={[`pin${pinNumber}`, ballName]}
                pcbX={x}
                pcbY={y}
                radius="0.2mm"
                solderMaskMargin="0.0254mm"
                shape="circle"
              />
            </Fragment>
          ))}
          <silkscreenpath
            route={[
              { x: -7, y: 7 },
              { x: 7, y: 7 },
              { x: 7, y: -7 },
              { x: -7, y: -7 },
              { x: -7, y: 7 },
            ]}
          />
          <silkscreencircle pcbX={-7.4} pcbY={6.4} radius="0.2mm" />
          <silkscreentext
            text="{NAME}"
            pcbX="0mm"
            pcbY="7.7mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -7.25, y: 7.25 },
              { x: 7.25, y: 7.25 },
              { x: 7.25, y: -7.25 },
              { x: -7.25, y: -7.25 },
              { x: -7.25, y: 7.25 },
            ]}
          />
        </footprint>
      }
    />
  )
}
