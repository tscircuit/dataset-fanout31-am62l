import {
  type AutorouterCompleteEvent,
  type AutorouterErrorEvent,
  type AutorouterProgressEvent,
  type GenericLocalAutorouter,
  RootCircuit,
  type SimpleRouteJson,
  type SimplifiedPcbTrace,
  type SolverStartedEvent,
} from "@tscircuit/core"
import type {
  FanoutSolver,
  FanoutSolverOptions,
} from "@tscircuit/fanout-solver"
import type { ReactElement } from "react"

const CAPTURE_COMPLETE_ERROR = "FANOUT_DATASET_CAPTURE_COMPLETE"
let captureConsoleErrorDepth = 0
let originalConsoleError: typeof console.error | undefined
const filteredCaptureConsoleError = (
  ...args: Parameters<typeof console.error>
) => {
  if (
    args.some((argument) => String(argument).includes(CAPTURE_COMPLETE_ERROR))
  )
    return
  originalConsoleError?.(...args)
}

const withoutCaptureConsoleError = async <Result>(
  operation: () => Promise<Result>,
): Promise<Result> => {
  if (captureConsoleErrorDepth === 0) {
    originalConsoleError = console.error
    console.error = filteredCaptureConsoleError
  }
  captureConsoleErrorDepth += 1
  try {
    return await operation()
  } finally {
    captureConsoleErrorDepth -= 1
    if (captureConsoleErrorDepth === 0) {
      if (console.error === filteredCaptureConsoleError && originalConsoleError)
        console.error = originalConsoleError
      originalConsoleError = undefined
    }
  }
}

/** The dataset captures fanout prefixes; a board-level router has no work here. */
export async function createBoardNoopAlgorithm(
  input: SimpleRouteJson,
): Promise<GenericLocalAutorouter> {
  const eventHandlers = {
    complete: [] as Array<(event: AutorouterCompleteEvent) => void>,
    error: [] as Array<(event: AutorouterErrorEvent) => void>,
    progress: [] as Array<(event: AutorouterProgressEvent) => void>,
  }
  const router: GenericLocalAutorouter = {
    input,
    isRouting: false,
    start() {
      if (this.isRouting) return
      this.isRouting = true
      queueMicrotask(() => {
        this.isRouting = false
        for (const handler of eventHandlers.complete)
          handler({ type: "complete", traces: [] })
      })
    },
    stop() {
      this.isRouting = false
    },
    on(event, callback) {
      eventHandlers[event].push(callback as never)
    },
    solveSync(): SimplifiedPcbTrace[] {
      return []
    },
  }
  return router
}

/** Capture after core's paired-breakout winding pass, before fanout solving. */
export async function captureCoreFanoutInput(circuitElement: ReactElement) {
  let captured:
    | readonly [
        ConstructorParameters<typeof FanoutSolver>[0],
        FanoutSolverOptions,
      ]
    | undefined
  const circuit = new RootCircuit()
  circuit.on("solver:started", (event: SolverStartedEvent) => {
    if (event.solverName !== "FanoutSolver" || captured) return
    captured = structuredClone(
      event.solverConstructorArgs,
    ) as unknown as readonly [
      ConstructorParameters<typeof FanoutSolver>[0],
      FanoutSolverOptions,
    ]
    // The debugger owns the solver; stop core's initial solve at its event.
    throw new Error(CAPTURE_COMPLETE_ERROR)
  })
  circuit.add(circuitElement)
  await withoutCaptureConsoleError(() => circuit.renderUntilSettled())
  if (!captured) {
    const errors = circuit
      .getCircuitJson()
      .filter((element) => element.type === "pcb_autorouting_error")
    throw new Error(
      `Core did not emit the SoC fanout solver input: ${errors.map((error) => error.message).join("; ")}`,
    )
  }
  return captured
}
