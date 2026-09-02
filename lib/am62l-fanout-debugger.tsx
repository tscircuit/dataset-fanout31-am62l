import { FanoutSolver } from "@tscircuit/fanout-solver"
import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { useEffect, useState } from "react"
import type { Am62lFanoutSample } from "./create-am62l-fanout-sample"
import type { MajorityDirection } from "./fanout-directions"

const directionColors: Record<MajorityDirection, string> = {
  up: "#2563eb",
  right: "#7c3aed",
  down: "#dc2626",
  left: "#059669",
}

export function Am62lFanoutDebugger({
  createSample,
}: {
  createSample: () => Promise<Am62lFanoutSample>
}) {
  const [sample, setSample] = useState<Am62lFanoutSample>()
  const [loadError, setLoadError] = useState<string>()

  useEffect(() => {
    let isCurrent = true
    setSample(undefined)
    setLoadError(undefined)
    createSample().then(
      (nextSample) => {
        if (isCurrent) setSample(nextSample)
      },
      (error) => {
        if (isCurrent) {
          setLoadError(error instanceof Error ? error.message : String(error))
        }
      },
    )
    return () => {
      isCurrent = false
    }
  }, [createSample])

  if (!sample) {
    return (
      <div
        style={{
          alignItems: "center",
          background: "#f8fafc",
          color: loadError ? "#b91c1c" : "#475569",
          display: "flex",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          justifyContent: "center",
          minHeight: "100vh",
          padding: 24,
        }}
      >
        {loadError
          ? `Could not build the core-generated fanout fixture: ${loadError}`
          : "Running core's breakout winding solver…"}
      </div>
    )
  }

  const directionColor = directionColors[sample.directionCase.majorityDirection]

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          display: "grid",
          gap: 12,
          padding: 16,
        }}
      >
        <div>
          <strong>
            Dataset Fanout31 · {sample.id} · {sample.name}
          </strong>
          <div style={{ color: "#475569", fontSize: 13, marginTop: 4 }}>
            373-ball AM62L32BOGHAANBR · 135 connections · 111 buses · 8 layers
          </div>
        </div>

        <div style={{ color: "#475569", fontSize: 13 }}>
          Complete tscircuit/core progressive-fanout workload: all 33 DDR
          signals in nine buses, three differential pairs, and 102 GND/VDDS_DDR
          plane drops.
        </div>

        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            fontSize: 13,
          }}
        >
          <span
            style={{
              background: directionColor,
              borderRadius: 999,
              color: "#ffffff",
              fontWeight: 700,
              padding: "4px 8px",
              textTransform: "uppercase",
            }}
          >
            majority {sample.directionCase.majorityDirection}
          </span>
          <code>{sample.directionCase.exitPosition}</code>
          <span style={{ color: "#475569" }}>{sample.description}</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {Object.entries(sample.signalBusExitPositions).map(
            ([busName, busExitPosition]) => (
              <span
                key={busName}
                style={{
                  background: "#eef2ff",
                  border: "1px solid #c7d2fe",
                  borderRadius: 999,
                  color: "#3730a3",
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  fontSize: 11,
                  padding: "4px 7px",
                }}
              >
                {busName} → {busExitPosition}
              </span>
            ),
          )}
        </div>
      </header>

      <GenericSolverDebugger
        createSolver={() =>
          new FanoutSolver(sample.simpleRouteJson, sample.solverOptions)
        }
        animationSpeed={80}
      />
    </div>
  )
}
