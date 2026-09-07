/**
 * Allwinner T113-S3, eLQFP128 with exposed ground pad (logical pin 129).
 * Manufacturer datasheet v1.6 (2022-03-03), Table 4-2, printed pp. 23-28:
 * https://datasheet.lcsc.com/datasheet/pdf/a431990106c90c1e37535402cd34f7c4.pdf?productCode=C5197687
 * Use the characteristics table, not the inconsistent labels in Figure 7-1.
 * The DZQ/PD/PG assignments and EPAD ground connection also agree with U9,
 * sheet 3 of the TinyEmbedded-Dual-A schematic:
 * https://github.com/yuansco/TinyEmbedded-Dual/blob/main/Document/TinyEmbedded_Dual_A.pdf
 */
export const T113S3_PIN_NAMES = [
  "PG6", // 1
  "PG7", // 2
  "PG8", // 3
  "PG9", // 4
  "PG10", // 5
  "PG11", // 6
  "PF0", // 7
  "PF1", // 8
  "PF2", // 9
  "PF3", // 10
  "PF4", // 11
  "PF5", // 12
  "PF6", // 13
  "PC7", // 14
  "PC6", // 15
  "PC5", // 16
  "PC4", // 17
  "PC3", // 18
  "PC2", // 19
  "VCC-PLL", // 20
  "REFCLK-OUT", // 21
  "DXOUT", // 22
  "DXIN", // 23
  "X32KOUT", // 24
  "X32KIN", // 25
  "VCC-RTC", // 26
  "RESET", // 27
  "LDOA-OUT", // 28
  "LDO-IN", // 29
  "LDOB-OUT", // 30
  "PE13", // 31
  "PE12", // 32
  "PE3", // 33
  "VCC-PE", // 34
  "PE2", // 35
  "PE11", // 36
  "PE10", // 37
  "PE9", // 38
  "PE8", // 39
  "PE7", // 40
  "PE6", // 41
  "PE5", // 42
  "PE4", // 43
  "PE0", // 44
  "PE1", // 45
  "VDD-SYS0", // 46
  "DZQ", // 47
  "VCC-DRAM0", // 48
  "VCC-DRAM1", // 49
  "VDD18-DRAM", // 50
  "VDD-SYS1", // 51
  "PD22", // 52
  "PD21", // 53
  "PD20", // 54
  "PD0", // 55
  "PD1", // 56
  "PD2", // 57
  "PD3", // 58
  "PD4", // 59
  "PD5", // 60
  "PD6", // 61
  "PD7", // 62
  "PD8", // 63
  "PD9", // 64
  "VCC-LVDS", // 65
  "VCC-PD", // 66
  "PD10", // 67
  "PD11", // 68
  "PD13", // 69
  "PD12", // 70
  "PD14", // 71
  "PD15", // 72
  "PD16", // 73
  "PD17", // 74
  "PD18", // 75
  "PD19", // 76
  "VCC-TVOUT", // 77
  "TVOUT0", // 78
  "PB7", // 79
  "PB6", // 80
  "VDD-SYS2", // 81
  "PB5", // 82
  "VCC-IO", // 83
  "PB4", // 84
  "PB3", // 85
  "PB2", // 86
  "MICIN3P", // 87
  "MICIN3N", // 88
  "AVCC", // 89
  "VRA2", // 90
  "AGND", // 91
  "VRA1", // 92
  "FMINR", // 93
  "FMINL", // 94
  "LINEINR", // 95
  "LINEINL", // 96
  "HPVCC", // 97
  "HPOUTR", // 98
  "HPOUTL", // 99
  "HPOUTFB", // 100
  "GPADC0", // 101
  "TP-X1", // 102
  "TP-X2", // 103
  "TP-Y1", // 104
  "TP-Y2", // 105
  "NC0", // 106
  "VCC-TVIN", // 107
  "TVIN0", // 108
  "TVIN1", // 109
  "TVIN-VRP", // 110
  "TVIN-VRN", // 111
  "USB1-DP", // 112
  "USB1-DM", // 113
  "USB0-DM", // 114
  "USB0-DP", // 115
  "VDD-CORE0", // 116
  "VDD-CORE1", // 117
  "PG1", // 118
  "PG2", // 119
  "PG0", // 120
  "PG3", // 121
  "PG5", // 122
  "PG4", // 123
  "PG12", // 124
  "PG13", // 125
  "PG14", // 126
  "PG15", // 127
  "VCC-PG", // 128
  "EPAD", // 129
] as const
export const T113S3_PINS = T113S3_PIN_NAMES.map((name, index) => ({
  pinNumber: index + 1,
  name,
}))
export const T113S3_NC_PIN = 106
export const T113S3_EXPOSED_PAD_PIN = 129
export const getT113s3Pin = (pinNumber: number) => {
  const pin = T113S3_PINS.find((p) => p.pinNumber === pinNumber)
  if (!pin) throw new Error(`Unknown T113-S3 pin ${pinNumber}`)
  return pin
}
