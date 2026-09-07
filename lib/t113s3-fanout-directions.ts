import type { FanoutExitPosition } from "@tscircuit/fanout-solver"
import { FANOUT_DIRECTION_CASES } from "./fanout-directions"

/** Keep the original AM62L case IDs stable and add a complete fifth family. */
export const T113S3_FANOUT_DIRECTION_CASES = FANOUT_DIRECTION_CASES.map(
  (directionCase, index) => ({
    ...directionCase,
    id: `${index + 49}-t113s3-${directionCase.id.slice(3)}`,
    name: `T113-S3 · ${directionCase.name}`,
    description: `T113-S3 all-pin fanout: ${directionCase.description}`,
  }),
)

export type T113s3FanoutDirectionCase =
  (typeof T113S3_FANOUT_DIRECTION_CASES)[number]

export function getT113s3FanoutDirectionCase(
  exitPosition: Exclude<FanoutExitPosition, "center">,
): T113s3FanoutDirectionCase {
  const directionCase = T113S3_FANOUT_DIRECTION_CASES.find(
    (candidate) => candidate.exitPosition === exitPosition,
  )
  if (!directionCase)
    throw new Error(`Unknown T113S3 direction ${exitPosition}`)
  return directionCase
}
