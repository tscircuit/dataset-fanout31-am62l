import type { FanoutExitPosition } from "@tscircuit/fanout-solver"
import { FANOUT_DIRECTION_CASES } from "./fanout-directions"

/** Keep the original AM62L case IDs stable and add a complete fourth family. */
export const IMX6ULL_FANOUT_DIRECTION_CASES = FANOUT_DIRECTION_CASES.map(
  (directionCase, index) => ({
    ...directionCase,
    id: `${index + 37}-imx6ull-${directionCase.id.slice(3)}`,
    name: `IMX6ULL · ${directionCase.name}`,
    description: `IMX6ULL to DDR3L: ${directionCase.description}`,
  }),
)

export type Imx6ullFanoutDirectionCase =
  (typeof IMX6ULL_FANOUT_DIRECTION_CASES)[number]

export function getImx6ullFanoutDirectionCase(
  exitPosition: Exclude<FanoutExitPosition, "center">,
): Imx6ullFanoutDirectionCase {
  const directionCase = IMX6ULL_FANOUT_DIRECTION_CASES.find(
    (candidate) => candidate.exitPosition === exitPosition,
  )
  if (!directionCase)
    throw new Error(`Unknown IMX6ULL direction ${exitPosition}`)
  return directionCase
}
