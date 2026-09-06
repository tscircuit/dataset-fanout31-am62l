import type { FanoutExitPosition } from "@tscircuit/fanout-solver"
import { FANOUT_DIRECTION_CASES } from "./fanout-directions"

export const K230_FANOUT_DIRECTION_CASES = FANOUT_DIRECTION_CASES.map(
  (sample, index) => ({
    ...sample,
    id: `${index + 25}-k230-${sample.id.slice(3)}`,
    name: `K230 · ${sample.name}`,
    description: `K230 to two x16 LPDDR4 memories: ${sample.description}`,
  }),
)
export type K230FanoutDirectionCase =
  (typeof K230_FANOUT_DIRECTION_CASES)[number]
export function getK230FanoutDirectionCase(
  exitPosition: Exclude<FanoutExitPosition, "center">,
): K230FanoutDirectionCase {
  const sample = K230_FANOUT_DIRECTION_CASES.find(
    (sample) => sample.exitPosition === exitPosition,
  )
  if (!sample) throw new Error(`Unknown K230 fanout direction ${exitPosition}`)
  return sample
}
