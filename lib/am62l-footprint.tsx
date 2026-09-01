import { Fragment } from "react"

// Copied from the AM62L32BOGHAANBR fixture used by
// tscircuit/core/tests/repros/repro-am62l-lpddr4-progressive-fanout.test.tsx.
// The package is a 0.5 mm, 23-by-23 FCCSP grid with depopulated positions.
const AM62L_ROW_NAMES = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "J",
  "K",
  "L",
  "M",
  "N",
  "P",
  "R",
  "T",
  "U",
  "V",
  "W",
  "Y",
  "AA",
  "AB",
  "AC",
] as const

const AM62L_ROW_MASKS = [
  "11111111111111111111111",
  "11111111111111111111111",
  "11010101001110010101011",
  "11110111001010011101111",
  "11000101111111110100011",
  "11111100000000000111111",
  "11010011111111111001011",
  "11111111010101011111111",
  "11000001101010110000011",
  "11000001110101110000011",
  "11111111101010111111111",
  "11101011010101011010111",
  "11111111101010111111111",
  "11000001110101110000011",
  "11000001101010110000011",
  "11111111010101011111111",
  "11010011111111111001011",
  "11111100000000000111111",
  "11000101111111110100011",
  "11110111001010011101111",
  "11010101001110010101011",
  "11111111111111111111111",
  "11111111111111111111111",
] as const

export const AM62L_PAD_POSITIONS = (() => {
  let pinNumber = 0
  return AM62L_ROW_MASKS.flatMap((rowMask, rowIndex) =>
    [...rowMask].flatMap((isPopulated, columnIndex) => {
      if (isPopulated !== "1") return []
      pinNumber += 1
      return [
        {
          ballName: `${AM62L_ROW_NAMES[rowIndex]}${columnIndex + 1}`,
          pinNumber,
          x: -5.5 + columnIndex * 0.5,
          y: 5.5 - rowIndex * 0.5,
        },
      ]
    }),
  )
})()

const AM62L_PIN_NUMBER_BY_BALL = new Map(
  AM62L_PAD_POSITIONS.map(({ ballName, pinNumber }) => [ballName, pinNumber]),
)

export function getAm62lPinNumber(ballName: string): number {
  const pinNumber = AM62L_PIN_NUMBER_BY_BALL.get(ballName)
  if (pinNumber === undefined) {
    throw new Error(`AM62L fixture does not contain ball ${ballName}`)
  }
  return pinNumber
}

export function Am62l() {
  return (
    <chip
      name="U1"
      manufacturerPartNumber="AM62L32BOGHAANBR"
      pcbX={0}
      pcbY={0}
      footprint={
        <footprint>
          {AM62L_PAD_POSITIONS.map(({ ballName, pinNumber, x, y }) => (
            <Fragment key={`am62l-pad-${pinNumber}`}>
              <smtpad
                portHints={[`pin${pinNumber}`, ballName]}
                pcbX={x}
                pcbY={y}
                radius="0.127mm"
                solderMaskMargin="0.0254mm"
                shape="circle"
              />
            </Fragment>
          ))}
          <silkscreenpath
            route={[
              { x: -5.95, y: 5.95 },
              { x: 5.95, y: 5.95 },
              { x: 5.95, y: -5.95 },
              { x: -5.95, y: -5.95 },
              { x: -5.95, y: 5.95 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -6.3, y: 5.5 },
              { x: -6.3201, y: 5.575 },
              { x: -6.375, y: 5.6299 },
              { x: -6.45, y: 5.65 },
              { x: -6.525, y: 5.6299 },
              { x: -6.5799, y: 5.575 },
              { x: -6.6, y: 5.5 },
              { x: -6.5799, y: 5.425 },
              { x: -6.525, y: 5.3701 },
              { x: -6.45, y: 5.35 },
              { x: -6.375, y: 5.3701 },
              { x: -6.3201, y: 5.425 },
              { x: -6.3, y: 5.5 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0mm"
            pcbY="6.8mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -6.2, y: 6.2 },
              { x: 6.2, y: 6.2 },
              { x: 6.2, y: -6.2 },
              { x: -6.2, y: -6.2 },
              { x: -6.2, y: 6.2 },
            ]}
          />
        </footprint>
      }
    />
  )
}
