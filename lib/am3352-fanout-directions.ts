import type { FanoutExitPosition } from "@tscircuit/fanout-solver"
import { FANOUT_DIRECTION_CASES } from "./fanout-directions"

/** Keep the original AM62L case IDs stable and add a complete sixth family. */
export const AM3352_FANOUT_DIRECTION_CASES = FANOUT_DIRECTION_CASES.map(
  (directionCase, index) => ({
    ...directionCase,
    id: `${index + 61}-am3352-${directionCase.id.slice(3)}`,
    name: `AM3352BZCZD80 · ${[0, 270, 180, 90][Math.floor(index / 3)]}° · ${["negative offset", "centered", "positive offset"][index % 3]}`,
    description:
      "Compact all-pin fanout with bus-specific exits on all four edges.",
    pcbRotation: [0, 270, 180, 90][Math.floor(index / 3)]!,
  }),
)

export type Am3352FanoutDirectionCase =
  (typeof AM3352_FANOUT_DIRECTION_CASES)[number]

export function getAm3352FanoutDirectionCase(
  exitPosition: Exclude<FanoutExitPosition, "center">,
): Am3352FanoutDirectionCase {
  const directionCase = AM3352_FANOUT_DIRECTION_CASES.find(
    (candidate) => candidate.exitPosition === exitPosition,
  )
  if (!directionCase)
    throw new Error(`Unknown AM3352 direction ${exitPosition}`)
  return directionCase
}
