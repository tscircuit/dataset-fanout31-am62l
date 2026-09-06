import type { FanoutExitPosition } from "@tscircuit/fanout-solver"
import { FANOUT_DIRECTION_CASES } from "./fanout-directions"

/** Keep the original AM62L case IDs stable and add a complete second family. */
export const RK3308_FANOUT_DIRECTION_CASES = FANOUT_DIRECTION_CASES.map(
  (directionCase, index) => ({
    ...directionCase,
    id: `${index + 13}-rk3308-${directionCase.id.slice(3)}`,
    name: `RK3308 · ${directionCase.name}`,
    description: `RK3308 to DDR3L: ${directionCase.description}`,
  }),
)

export type Rk3308FanoutDirectionCase =
  (typeof RK3308_FANOUT_DIRECTION_CASES)[number]

export function getRk3308FanoutDirectionCase(
  exitPosition: Exclude<FanoutExitPosition, "center">,
): Rk3308FanoutDirectionCase {
  const directionCase = RK3308_FANOUT_DIRECTION_CASES.find(
    (candidate) => candidate.exitPosition === exitPosition,
  )
  if (!directionCase)
    throw new Error(`Unknown RK3308 direction ${exitPosition}`)
  return directionCase
}
