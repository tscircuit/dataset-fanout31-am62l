import { Fragment } from "react"

/**
 * Samsung K4B4G1646E-BYMA, 4 Gb (256M x16) DDR3L.
 * Pinout and body: Samsung datasheet, rev. 1.0 (December 2014), sections 3.1-3.2.
 * https://files.iczoom.com/hjiczoom/images/public/basicproduct/1476762220150_K4B4G1646E.pdf
 * This manufacturer-authored PDF is mirrored because Samsung's old download is
 * no longer available. Coordinates follow its top view, with A1 at upper left.
 */
export const DDR3L_PART_NUMBER = "K4B4G1646E-BYMA"

export const DDR3L_BALL_ROWS = [
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

export const DDR3L_BALL_COLUMNS = [1, 2, 3, 7, 8, 9] as const

export const DDR3L_BALL_NAMES = DDR3L_BALL_ROWS.flatMap((rowName) =>
  DDR3L_BALL_COLUMNS.map((columnNumber) => `${rowName}${columnNumber}`),
)

/** DQL/DQU are normalized to DQ0-DQ15; _N denotes active-low or negative pins. */
export const DDR3L_SIGNAL_BALLS = {
  DQ0: "E3",
  DQ1: "F7",
  DQ2: "F2",
  DQ3: "F8",
  DQ4: "H3",
  DQ5: "H8",
  DQ6: "G2",
  DQ7: "H7",
  DQ8: "D7",
  DQ9: "C3",
  DQ10: "C8",
  DQ11: "C2",
  DQ12: "A7",
  DQ13: "A2",
  DQ14: "B8",
  DQ15: "A3",
  A0: "N3",
  A1: "P7",
  A2: "P3",
  A3: "N2",
  A4: "P8",
  A5: "P2",
  A6: "R8",
  A7: "R2",
  A8: "T8",
  A9: "R3",
  A10: "L7",
  A11: "R7",
  A12: "N7",
  A13: "T3",
  A14: "T7",
  BA0: "M2",
  BA1: "N8",
  BA2: "M3",
  CK: "J7",
  CK_N: "K7",
  DM0: "E7",
  DM1: "D3",
  DQS0: "F3",
  DQS0_N: "G3",
  DQS1: "C7",
  DQS1_N: "B7",
  CKE: "K9",
  CS_N: "L2",
  ODT: "K1",
  RAS_N: "J3",
  CAS_N: "K3",
  WE_N: "L3",
  RESET_N: "T2",
} as const

export type Ddr3lSignal = keyof typeof DDR3L_SIGNAL_BALLS

export const DDR3L_PAD_POSITIONS = DDR3L_BALL_ROWS.flatMap(
  (rowName, rowIndex) =>
    DDR3L_BALL_COLUMNS.map((columnNumber, columnIndex) => ({
      ballName: `${rowName}${columnNumber}`,
      pinNumber: rowIndex * DDR3L_BALL_COLUMNS.length + columnIndex + 1,
      x: Number(((columnNumber - 5) * 0.8).toFixed(4)),
      y: Number((6 - rowIndex * 0.8).toFixed(4)),
    })),
)

export function getDdr3lPinNumber(ballName: string): number {
  const index = DDR3L_BALL_NAMES.indexOf(ballName)
  if (index === -1) throw new Error(`Unknown DDR3L ball: ${ballName}`)
  return index + 1
}

/**
 * The 0.4 mm copper land diameter is a dataset land-pattern choice, distinct
 * from the datasheet's 0.50 +/- 0.05 mm solder-ball diameter. It matches the
 * 96-ball, 0.8 mm-pitch land pattern in KiCad's official footprint library:
 * https://github.com/KiCad/kicad-footprints/blob/master/Package_BGA.pretty/BGA-96_9.0x13.0mm_Layout2x3x16_P0.8mm.kicad_mod
 * The body outline below uses Samsung's actual 7.5 x 13.3 mm dimensions.
 */
export const DDR3L_PAD_DIAMETER = 0.4

export function Ddr3l({
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
      manufacturerPartNumber={DDR3L_PART_NUMBER}
      noSchematicRepresentation
      footprint={
        <footprint>
          {DDR3L_PAD_POSITIONS.map(({ ballName, pinNumber, x, y }) => (
            <Fragment key={`ddr3l-ball-${ballName}`}>
              <smtpad
                portHints={[`pin${pinNumber}`, ballName]}
                pcbX={x}
                pcbY={y}
                radius={DDR3L_PAD_DIAMETER / 2}
                shape="circle"
              />
            </Fragment>
          ))}
          <silkscreenpath
            route={[
              { x: -3.75, y: -6.65 },
              { x: 3.75, y: -6.65 },
              { x: 3.75, y: 6.65 },
              { x: -3.75, y: 6.65 },
              { x: -3.75, y: -6.65 },
            ]}
          />
          <silkscreencircle pcbX={-3.45} pcbY={6.35} radius="0.12mm" />
        </footprint>
      }
    />
  )
}
