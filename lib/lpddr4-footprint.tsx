import { Fragment } from "react"

const LPDDR4_BALL_ROWS = [
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
] as const

const LPDDR4_BALL_COLUMNS = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12] as const

export const LPDDR4_BALL_NAMES = LPDDR4_BALL_ROWS.flatMap((rowName) =>
  LPDDR4_BALL_COLUMNS.map((columnNumber) => `${rowName}${columnNumber}`),
)

const LPDDR4_BALL_X = [-4.4, -3.6, -2.8, -2, -1.2, 1.2, 2, 2.8, 3.6, 4.4]
const LPDDR4_BALL_Y = [
  6.825, 6.175, 5.525, 4.875, 4.225, 3.575, 2.925, 2.275, 1.625, 0.975, -0.975,
  -1.625, -2.275, -2.925, -3.575, -4.225, -4.875, -5.525, -6.175, -6.825,
]

const LPDDR4_BALL_POSITIONS = LPDDR4_BALL_Y.flatMap((y) =>
  LPDDR4_BALL_X.map((x) => ({ x, y })),
)

/** MT53E1G16D1ZW package geometry copied from the core AM62L repro. */
export function Lpddr4({
  pcbX,
  pcbY,
  pcbRotation,
}: {
  pcbX: number
  pcbY: number
  pcbRotation: number
}) {
  return (
    <chip
      name="U2"
      pcbX={pcbX}
      pcbY={pcbY}
      pcbRotation={pcbRotation}
      manufacturerPartNumber="MT53E1G16D1ZW"
      noSchematicRepresentation
      footprint={
        <footprint>
          {LPDDR4_BALL_POSITIONS.map(({ x, y }, index) => (
            <Fragment key={`lpddr4-ball-${index + 1}`}>
              <smtpad
                portHints={[`pin${index + 1}`, LPDDR4_BALL_NAMES[index]!]}
                pcbX={x}
                pcbY={y}
                radius="0.16mm"
                shape="circle"
              />
            </Fragment>
          ))}
          <silkscreenpath
            route={[
              { x: -5, y: -7.25 },
              { x: 5, y: -7.25 },
              { x: 5, y: 7.25 },
              { x: -5, y: 7.25 },
              { x: -5, y: -7.25 },
            ]}
          />
          <silkscreencircle pcbX={-4.65} pcbY={6.9} radius="0.18mm" />
        </footprint>
      }
    />
  )
}
