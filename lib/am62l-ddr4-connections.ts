export type Am62lDdr4ConnectionGroup =
  | "BYTE0"
  | "BYTE1"
  | "DQS0"
  | "DQS1"
  | "CK"
  | "ADDR_CTRL"
  | "RESET"

export interface Am62lDdr4Connection {
  name: string
  socBall: string
  memoryBall: string
  group: Am62lDdr4ConnectionGroup
}

export const AM62L_DDR4_CONNECTIONS = [
  { name: "DDR_DQ0", group: "BYTE0", socBall: "F4", memoryBall: "G2" },
  { name: "DDR_DQ1", group: "BYTE0", socBall: "F3", memoryBall: "F7" },
  { name: "DDR_DQ2", group: "BYTE0", socBall: "F1", memoryBall: "H3" },
  { name: "DDR_DQ3", group: "BYTE0", socBall: "E1", memoryBall: "H7" },
  { name: "DDR_DQ4", group: "BYTE0", socBall: "G4", memoryBall: "H2" },
  { name: "DDR_DQ5", group: "BYTE0", socBall: "H4", memoryBall: "H8" },
  { name: "DDR_DQ6", group: "BYTE0", socBall: "H2", memoryBall: "J3" },
  { name: "DDR_DQ7", group: "BYTE0", socBall: "H3", memoryBall: "J7" },
  { name: "DDR_DQ8", group: "BYTE1", socBall: "V4", memoryBall: "A3" },
  { name: "DDR_DQ9", group: "BYTE1", socBall: "T3", memoryBall: "B8" },
  { name: "DDR_DQ10", group: "BYTE1", socBall: "T1", memoryBall: "C3" },
  { name: "DDR_DQ11", group: "BYTE1", socBall: "U1", memoryBall: "C7" },
  { name: "DDR_DQ12", group: "BYTE1", socBall: "U4", memoryBall: "C2" },
  { name: "DDR_DQ13", group: "BYTE1", socBall: "V5", memoryBall: "C8" },
  { name: "DDR_DQ14", group: "BYTE1", socBall: "U2", memoryBall: "D3" },
  { name: "DDR_DQ15", group: "BYTE1", socBall: "W1", memoryBall: "D7" },
  { name: "DDR_DM0", group: "BYTE0", socBall: "F2", memoryBall: "E7" },
  { name: "DDR_DM1", group: "BYTE1", socBall: "W2", memoryBall: "E2" },
  { name: "DDR_DQS0_P", group: "DQS0", socBall: "G1", memoryBall: "G3" },
  { name: "DDR_DQS0_N", group: "DQS0", socBall: "G2", memoryBall: "F3" },
  { name: "DDR_DQS1_P", group: "DQS1", socBall: "V1", memoryBall: "B7" },
  { name: "DDR_DQS1_N", group: "DQS1", socBall: "V2", memoryBall: "A7" },
  { name: "DDR_CK_P", group: "CK", socBall: "P1", memoryBall: "K7" },
  { name: "DDR_CK_N", group: "CK", socBall: "P2", memoryBall: "K8" },
  { name: "DDR_A0", group: "ADDR_CTRL", socBall: "L5", memoryBall: "P3" },
  { name: "DDR_A1", group: "ADDR_CTRL", socBall: "H6", memoryBall: "P7" },
  { name: "DDR_A2", group: "ADDR_CTRL", socBall: "L6", memoryBall: "R3" },
  { name: "DDR_A3", group: "ADDR_CTRL", socBall: "K2", memoryBall: "N7" },
  { name: "DDR_A4", group: "ADDR_CTRL", socBall: "J1", memoryBall: "N3" },
  { name: "DDR_A5", group: "ADDR_CTRL", socBall: "H5", memoryBall: "P8" },
  { name: "DDR_A6", group: "ADDR_CTRL", socBall: "R2", memoryBall: "P2" },
  { name: "DDR_A7", group: "ADDR_CTRL", socBall: "N6", memoryBall: "R8" },
  { name: "DDR_A8", group: "ADDR_CTRL", socBall: "T4", memoryBall: "R2" },
  { name: "DDR_A9", group: "ADDR_CTRL", socBall: "N1", memoryBall: "R7" },
  { name: "DDR_A10", group: "ADDR_CTRL", socBall: "T5", memoryBall: "M3" },
  { name: "DDR_A11", group: "ADDR_CTRL", socBall: "T6", memoryBall: "T2" },
  { name: "DDR_A12", group: "ADDR_CTRL", socBall: "W6", memoryBall: "M7" },
  { name: "DDR_A13", group: "ADDR_CTRL", socBall: "V6", memoryBall: "T8" },
  { name: "DDR_BA0", group: "ADDR_CTRL", socBall: "N3", memoryBall: "N2" },
  { name: "DDR_BA1", group: "ADDR_CTRL", socBall: "N2", memoryBall: "N8" },
  { name: "DDR_BG0", group: "ADDR_CTRL", socBall: "N5", memoryBall: "M2" },
  { name: "DDR_ACT_n", group: "ADDR_CTRL", socBall: "M2", memoryBall: "L3" },
  { name: "DDR_CAS_n", group: "ADDR_CTRL", socBall: "L1", memoryBall: "M8" },
  { name: "DDR_RAS_n", group: "ADDR_CTRL", socBall: "M5", memoryBall: "L8" },
  { name: "DDR_WE_n", group: "ADDR_CTRL", socBall: "L2", memoryBall: "L2" },
  { name: "DDR_CKE", group: "ADDR_CTRL", socBall: "K1", memoryBall: "K2" },
  { name: "DDR_CS_n", group: "ADDR_CTRL", socBall: "L3", memoryBall: "L7" },
  { name: "DDR_ODT", group: "ADDR_CTRL", socBall: "L4", memoryBall: "K3" },
  { name: "DDR_RESET_N", group: "RESET", socBall: "J2", memoryBall: "P1" },
] as const satisfies readonly Am62lDdr4Connection[]

export const AM62L_DDR4_CONNECTION_COUNT = AM62L_DDR4_CONNECTIONS.length
