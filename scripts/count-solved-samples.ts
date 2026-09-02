import { FanoutSolver } from "@tscircuit/fanout-solver"
import { FANOUT_DIRECTION_CASES } from "../lib/fanout-directions"
import { AM62L_SAMPLE_DEFINITIONS } from "../samples"

const SAMPLE_FLAG = "--sample"
const DEFAULT_TIMEOUT_MS = 60_000

interface SolveResult {
  exitPosition: string
  solved: boolean
  failed: boolean
  elapsedMs: number
  error?: string
}

const solveOneSample = async (exitPosition: string): Promise<SolveResult> => {
  const directionCase = FANOUT_DIRECTION_CASES.find(
    (candidate) => candidate.exitPosition === exitPosition,
  )
  if (!directionCase) throw new Error(`Unknown fanout sample ${exitPosition}`)
  const sampleDefinition = AM62L_SAMPLE_DEFINITIONS.find(
    (candidate) => candidate.exitPosition === exitPosition,
  )
  if (!sampleDefinition) {
    throw new Error(`Missing TSX sample module for ${exitPosition}`)
  }
  const sample = await sampleDefinition.createSample()
  const solver = new FanoutSolver(sample.simpleRouteJson, sample.solverOptions)
  const startedAt = performance.now()
  solver.solve()
  const elapsedMs = performance.now() - startedAt
  const output = solver.getOutput()
  return {
    exitPosition,
    solved: !solver.failed && output.validation.valid,
    failed: solver.failed,
    elapsedMs,
    ...(solver.error ? { error: solver.error } : {}),
  }
}

const sampleFlagIndex = process.argv.indexOf(SAMPLE_FLAG)
if (sampleFlagIndex !== -1) {
  const exitPosition = process.argv[sampleFlagIndex + 1]
  if (!exitPosition) throw new Error(`${SAMPLE_FLAG} requires an exit position`)
  try {
    console.log(JSON.stringify(await solveOneSample(exitPosition)))
  } catch (error) {
    console.log(
      JSON.stringify({
        exitPosition,
        solved: false,
        failed: true,
        elapsedMs: 0,
        error: error instanceof Error ? error.message : String(error),
      } satisfies SolveResult),
    )
  }
  process.exit(0)
}

const configuredTimeout = Number(
  process.env.FANOUT_SAMPLE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS,
)
const timeoutMs = Number.isFinite(configuredTimeout)
  ? configuredTimeout
  : DEFAULT_TIMEOUT_MS
const results: Array<SolveResult & { timedOut?: boolean }> = []

for (const directionCase of FANOUT_DIRECTION_CASES) {
  const child = Bun.spawn(
    [
      process.execPath,
      import.meta.path,
      SAMPLE_FLAG,
      directionCase.exitPosition,
    ],
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

  let result: SolveResult & { timedOut?: boolean }
  if (timedOut) {
    result = {
      exitPosition: directionCase.exitPosition,
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
        exitPosition: directionCase.exitPosition,
        solved: false,
        failed: true,
        elapsedMs: 0,
        error: stderr || stdout || "Child solve returned no result",
      }
    }
  }
  results.push(result)
  console.log(
    `${directionCase.id}: ${result.solved ? "SOLVED" : result.timedOut ? "TIMEOUT" : "FAILED"} (${Math.round(result.elapsedMs)} ms)${result.error ? ` — ${result.error}` : ""}`,
  )
}

const solvedCount = results.filter((result) => result.solved).length
console.log(
  `\nSolved ${solvedCount}/${results.length} complete AM62L problems.`,
)
