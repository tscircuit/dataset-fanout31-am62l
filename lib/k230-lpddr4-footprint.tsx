import { Fragment } from "react"

/**
 * Micron MT53E256M16D1FW-046 AIT:B: one x16 channel and one rank per package.
 * Sources: Micron 200b_z00m_sdp_ddp_auto_lpddr4_lpddr4x.pdf, Rev. F (10/2020),
 * Figure 4 (p. 20, top view / balls down) and Figure 7 (p. 24, FW outline).
 * https://datasheet.lcsc.com/datasheet/pdf/cafc8b028f5fedc321cc6d079eead257.pdf?productCode=C5330485
 *
 * Each package is 4 Gb (512 MiB); the pair totals 1 GiB, within K230's 2 GiB limit.
 * All 200 occupied balls are obstacles, including NC and DNU balls. Columns 6
 * and 7 and rows L and M are not populated. The 0.40 mm land diameter is the
 * SMD board-pad diameter used in the manufacturer's package drawing; it is
 * distinct from the nominal 0.436 mm post-reflow solder-ball diameter.
 */
const BALL_ROWS = [
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
const BALL_COLUMNS = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12] as const
const FULL_ROW_NAMES = [
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
] as const

/** Figure 4, transcribed left to right in each populated row. */
const BALL_FUNCTION_ROWS: Record<(typeof BALL_ROWS)[number], string> = {
  A: "DNU DNU VSS VDD2 ZQ NC VDD2 VSS DNU DNU",
  B: "DNU DQ0 VDDQ DQ7 VDDQ VDDQ DQ15 VDDQ DQ8 DNU",
  C: "VSS DQ1 DMI0 DQ6 VSS VSS DQ14 DMI1 DQ9 VSS",
  D: "VDDQ VSS DQS0_t VSS VDDQ VDDQ VSS DQS1_t VSS VDDQ",
  E: "VSS DQ2 DQS0_c DQ5 VSS VSS DQ13 DQS1_c DQ10 VSS",
  F: "VDD1 DQ3 VDDQ DQ4 VDD2 VDD2 DQ12 VDDQ DQ11 VDD1",
  G: "VSS ODT_CA VSS VDD1 VSS VSS VDD1 VSS NC VSS",
  H: "VDD2 CA0 NC CS VDD2 VDD2 CA2 CA3 CA4 VDD2",
  J: "VSS CA1 VSS CKE NC CK_t CK_c VSS CA5 VSS",
  K: "VDD2 VSS VDD2 VSS NC NC VSS VDD2 VSS VDD2",
  N: "VDD2 VSS VDD2 VSS NC NC VSS VDD2 VSS VDD2",
  P: "VSS NC VSS NC NC NC NC VSS NC VSS",
  R: "VDD2 NC NC NC VDD2 VDD2 NC NC NC VDD2",
  T: "VSS NC VSS VDD1 VSS VSS VDD1 VSS RESET_n VSS",
  U: "VDD1 NC VDDQ NC VDD2 VDD2 NC VDDQ NC VDD1",
  V: "VSS NC NC NC VSS VSS NC NC NC VSS",
  W: "VDDQ VSS NC VSS VDDQ VDDQ VSS NC VSS VDDQ",
  Y: "VSS NC NC NC VSS VSS NC NC NC VSS",
  AA: "DNU NC VDDQ NC VDDQ VDDQ NC VDDQ NC DNU",
  AB: "DNU DNU VSS VDD2 VSS VSS VDD2 VSS DNU DNU",
}

export const K230_LPDDR4_SIGNAL_BALLS = {
  DQ0: "B2",
  DQ1: "C2",
  DQ2: "E2",
  DQ3: "F2",
  DQ4: "F4",
  DQ5: "E4",
  DQ6: "C4",
  DQ7: "B4",
  DQ8: "B11",
  DQ9: "C11",
  DQ10: "E11",
  DQ11: "F11",
  DQ12: "F9",
  DQ13: "E9",
  DQ14: "C9",
  DQ15: "B9",
  CA0: "H2",
  CA1: "J2",
  CA2: "H9",
  CA3: "H10",
  CA4: "H11",
  CA5: "J11",
  CK: "J8",
  CK_N: "J9",
  DQS0: "D3",
  DQS0_N: "E3",
  DQS1: "D10",
  DQS1_N: "E10",
  DMI0: "C3",
  DMI1: "C10",
  CS0: "H4",
  CKE0: "J4",
  RESET_N: "T11",
} as const

export const K230_LPDDR4_PAD_POSITIONS = BALL_ROWS.flatMap(
  (rowName, rowIndex) =>
    BALL_COLUMNS.map((columnNumber, columnIndex) => ({
      ballName: `${rowName}${columnNumber}`,
      signalName: BALL_FUNCTION_ROWS[rowName].split(" ")[columnIndex]!,
      pinNumber: rowIndex * BALL_COLUMNS.length + columnIndex + 1,
      x: Number(((columnNumber - 6.5) * 0.8).toFixed(3)),
      y: Number(((10.5 - FULL_ROW_NAMES.indexOf(rowName)) * 0.65).toFixed(3)),
    })),
)

const PIN_NUMBER_BY_BALL = new Map(
  K230_LPDDR4_PAD_POSITIONS.map(({ ballName, pinNumber }) => [
    ballName,
    pinNumber,
  ]),
)

export function getK230Lpddr4PinNumber(ballName: string): number {
  const pinNumber = PIN_NUMBER_BY_BALL.get(ballName)
  if (pinNumber === undefined) {
    throw new Error(`K230 LPDDR4 fixture does not contain ball ${ballName}`)
  }
  return pinNumber
}

export function K230Lpddr4({
  name,
  pcbX,
  pcbY,
  pcbRotation,
}: {
  name: "U2" | "U3"
  pcbX: number
  pcbY: number
  pcbRotation: number
}) {
  return (
    <chip
      name={name}
      manufacturerPartNumber="MT53E256M16D1FW-046 AIT:B"
      pcbX={pcbX}
      pcbY={pcbY}
      pcbRotation={pcbRotation}
      noSchematicRepresentation
      footprint={
        <footprint>
          {K230_LPDDR4_PAD_POSITIONS.map(({ ballName, pinNumber, x, y }) => (
            <Fragment key={`k230-lpddr4-pad-${pinNumber}`}>
              <smtpad
                portHints={[`pin${pinNumber}`, ballName]}
                pcbX={x}
                pcbY={y}
                radius="0.20mm"
                shape="circle"
              />
            </Fragment>
          ))}
          <silkscreenpath
            route={[
              { x: -5, y: 7.25 },
              { x: 5, y: 7.25 },
              { x: 5, y: -7.25 },
              { x: -5, y: -7.25 },
              { x: -5, y: 7.25 },
            ]}
          />
          <silkscreencircle pcbX={-5.35} pcbY={6.825} radius="0.18mm" />
        </footprint>
      }
    />
  )
}
