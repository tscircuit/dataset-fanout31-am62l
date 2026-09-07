import { FanoutSolver } from "@tscircuit/fanout-solver"
import {
  FANOUT_SAMPLE_DEFINITIONS,
  type FanoutChip,
  type FanoutSampleDefinition,
} from "../samples"

const DEFAULT_TIMEOUT_MS = 60_000

export const SOLVE_COUNT_HELP = `Usage: bun run solve-count [--chip am62l|rk3308|k230|imx6ull|all] [--sample ID|EXIT]

With no arguments, solve all ${FANOUT_SAMPLE_DEFINITIONS.length} samples. --chip selects one chip family.
--sample selects a unique ID, such as 13-rk3308-top-left-offset.
Legacy exit names, such as topside_left, default to AM62L unless --chip
selects rk3308, k230, or imx6ull. Use a unique ID when combining --sample with --chip all.
Single-sample results are emitted as JSON.

FANOUT_SAMPLE_TIMEOUT_MS sets the per-sample timeout for a full-family run
(default: ${DEFAULT_TIMEOUT_MS} ms).`

interface SolveResult {
  id: string
  chip: FanoutChip
  exitPosition: string
  solved: boolean
  failed: boolean
  elapsedMs: number
  error?: string
  timedOut?: boolean
}

export function selectSamples(args: readonly string[]): {
  samples: readonly FanoutSampleDefinition[]
  singleSample: boolean
} {
  let chip: FanoutChip | "all" | undefined
  let sampleSelector: string | undefined

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument !== "--chip" && argument !== "--sample") {
      throw new Error(`Unknown argument ${argument}. Use --help for usage.`)
    }
    const value = args[++index]
    if (!value || value.startsWith("--")) {
      throw new Error(`${argument} requires a value`)
    }
    if (argument === "--chip") {
      if (chip !== undefined)
        throw new Error("--chip may only be specified once")
      if (
        value !== "am62l" &&
        value !== "rk3308" &&
        value !== "k230" &&
        value !== "imx6ull" &&
        value !== "all"
      ) {
        throw new Error(
          `Unknown chip ${value}; expected am62l, rk3308, k230, imx6ull, or all`,
        )
      }
      chip = value
    } else {
      if (sampleSelector !== undefined) {
        throw new Error("--sample may only be specified once")
      }
      sampleSelector = value
    }
  }

  const selectedChip = chip ?? "all"
  if (!sampleSelector) {
    return {
      samples: FANOUT_SAMPLE_DEFINITIONS.filter(
        (definition) =>
          selectedChip === "all" || definition.chip === selectedChip,
      ),
      singleSample: false,
    }
  }

  const exactSample = FANOUT_SAMPLE_DEFINITIONS.find(
    (definition) => definition.id === sampleSelector,
  )
  if (exactSample) {
    if (selectedChip !== "all" && exactSample.chip !== selectedChip) {
      throw new Error(
        `Sample ${sampleSelector} does not belong to chip ${selectedChip}`,
      )
    }
    return { samples: [exactSample], singleSample: true }
  }

  const exitChip = chip ?? "am62l"
  const samples = FANOUT_SAMPLE_DEFINITIONS.filter(
    (definition) =>
      definition.exitPosition === sampleSelector &&
      (exitChip === "all" || definition.chip === exitChip),
  )
  if (samples.length > 1) {
    throw new Error(
      `Exit ${sampleSelector} matches multiple chips; use a sample ID or select --chip am62l|rk3308|k230|imx6ull`,
    )
  }
  if (samples.length === 0) {
    throw new Error(`Unknown fanout sample ${sampleSelector}`)
  }
  return { samples, singleSample: true }
}

const sampleIdentity = (definition: FanoutSampleDefinition) => ({
  id: definition.id,
  chip: definition.chip,
  exitPosition: definition.exitPosition,
})

const solveOneSample = async (
  definition: FanoutSampleDefinition,
): Promise<SolveResult> => {
  const sample = await definition.createSample()
  const solver = new FanoutSolver(sample.simpleRouteJson, sample.solverOptions)
  const startedAt = performance.now()
  solver.solve()
  const elapsedMs = performance.now() - startedAt
  const output = solver.getOutput()
  return {
    ...sampleIdentity(definition),
    solved: !solver.failed && output.validation.valid,
    failed: solver.failed,
    elapsedMs,
    ...(solver.error ? { error: solver.error } : {}),
  }
}

export async function main(args = process.argv.slice(2)) {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(SOLVE_COUNT_HELP)
    return
  }
  const { samples, singleSample } = selectSamples(args)
  if (singleSample) {
    const definition = samples[0]!
    try {
      console.log(JSON.stringify(await solveOneSample(definition)))
    } catch (error) {
      console.log(
        JSON.stringify({
          ...sampleIdentity(definition),
          solved: false,
          failed: true,
          elapsedMs: 0,
          error: error instanceof Error ? error.message : String(error),
        } satisfies SolveResult),
      )
    }
    return
  }

  const configuredTimeout = Number(
    process.env.FANOUT_SAMPLE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS,
  )
  const timeoutMs =
    Number.isFinite(configuredTimeout) && configuredTimeout > 0
      ? configuredTimeout
      : DEFAULT_TIMEOUT_MS
  const results: SolveResult[] = []

  for (const definition of samples) {
    const child = Bun.spawn(
      [process.execPath, import.meta.path, "--sample", definition.id],
      { stdout: "pipe", stderr: "pipe" },
    )
    const stdoutPromise = new Response(child.stdout).text()
    const stderrPromise = new Response(child.stderr).text()
    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      child.kill("SIGKILL")
    }, timeoutMs)
    await child.exited
    clearTimeout(timeout)
    const stdout = (await stdoutPromise).trim()
    const stderr = (await stderrPromise).trim()

    let result: SolveResult
    if (timedOut) {
      result = {
        ...sampleIdentity(definition),
        solved: false,
        failed: true,
        elapsedMs: timeoutMs,
        timedOut: true,
        error: `Timed out after ${timeoutMs} ms`,
      }
    } else {
      try {
        result = JSON.parse(stdout) as SolveResult
      } catch {
        result = {
          ...sampleIdentity(definition),
          solved: false,
          failed: true,
          elapsedMs: 0,
          error: stderr || stdout || "Child solve returned no result",
        }
      }
    }
    results.push(result)
    console.log(
      `${definition.id}: ${result.solved ? "SOLVED" : result.timedOut ? "TIMEOUT" : "FAILED"} (${Math.round(result.elapsedMs)} ms)${result.error ? ` — ${result.error}` : ""}`,
    )
  }

  const solvedCount = results.filter((result) => result.solved).length
  const chipNames = [...new Set(samples.map((definition) => definition.chip))]
    .map((chip) => chip.toUpperCase())
    .join(" and ")
  console.log(
    `\nSolved ${solvedCount}/${results.length} complete ${chipNames} problems.`,
  )
}

if (import.meta.main) {
  try {
    await main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
