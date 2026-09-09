import { Fragment } from "react"

const DDR4_ROW_NAMES = [
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
] as const

const DDR4_COLUMN_NAMES = [1, 2, 3, 7, 8, 9] as const

export const DDR4_PAD_POSITIONS = DDR4_ROW_NAMES.flatMap((row, rowIndex) =>
  DDR4_COLUMN_NAMES.map((column, columnIndex) => ({
    ballName: `${row}${column}`,
    pinNumber: rowIndex * DDR4_COLUMN_NAMES.length + columnIndex + 1,
    x: [-3.2, -2.4, -1.6, 1.6, 2.4, 3.2][columnIndex]!,
    y: 6 - rowIndex * 0.8,
  })),
)

const DDR4_PIN_NUMBER_BY_BALL = new Map(
  DDR4_PAD_POSITIONS.map(({ ballName, pinNumber }) => [ballName, pinNumber]),
)

export function getDdr4PinNumber(ballName: string): number {
  const pinNumber = DDR4_PIN_NUMBER_BY_BALL.get(ballName)
  if (pinNumber === undefined) {
    throw new Error(`DDR4 fixture does not contain ball ${ballName}`)
  }
  return pinNumber
}

export function Ddr4({
  name = "U_DDR",
  pcbX = 0,
  pcbY = 0,
  pcbRotation = 0,
}: {
  name?: string
  pcbX?: number
  pcbY?: number
  pcbRotation?: number
}) {
  return (
    <chip
      name={name}
      manufacturerPartNumber="MT40A512M16LY-075:E"
      pcbX={pcbX}
      pcbY={pcbY}
      pcbRotation={pcbRotation}
      footprint={
        <footprint>
          {DDR4_PAD_POSITIONS.map(({ ballName, pinNumber, x, y }) => (
            <Fragment key={`ddr4-pad-${pinNumber}`}>
              <smtpad
                portHints={[`pin${pinNumber}`, ballName]}
                pcbX={x}
                pcbY={y}
                radius="0.2mm"
                solderMaskMargin="0.025mm"
                shape="circle"
              />
            </Fragment>
          ))}
          <silkscreenrect pcbX={0} pcbY={0} width="7.6mm" height="13.5mm" />
          <courtyardoutline
            outline={[
              { x: -4.375, y: 7.02 },
              { x: 4.375, y: 7.02 },
              { x: 4.375, y: -7.02 },
              { x: -4.375, y: -7.02 },
              { x: -4.375, y: 7.02 },
            ]}
          />
        </footprint>
      }
    />
  )
}
