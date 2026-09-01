import { FanoutSolver } from "@tscircuit/fanout-solver"
import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { createAm62lFanoutSample } from "lib/create-am62l-fanout-sample"
import {
  FANOUT_DIRECTION_CASES,
  type MajorityDirection,
} from "lib/fanout-directions"
import { useMemo, useState } from "react"

const directionColors: Record<MajorityDirection, string> = {
  up: "#2563eb",
  right: "#7c3aed",
  down: "#dc2626",
  left: "#059669",
}

export default function Am62lFanoutDirectionsPage() {
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0)
  const selectedCase =
    FANOUT_DIRECTION_CASES[selectedCaseIndex] ?? FANOUT_DIRECTION_CASES[0]
  const sample = useMemo(
    () => createAm62lFanoutSample(selectedCase.exitPosition),
    [selectedCase.exitPosition],
  )

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
          <strong>Dataset Fanout31 · AM62L directional exits</strong>
          <div style={{ color: "#475569", fontSize: 13, marginTop: 4 }}>
            373-ball AM62L32BOGHAANBR · 0.5 mm pitch · 12 fanout directions
          </div>
        </div>

        <div style={{ color: "#475569", fontSize: 13 }}>
          Each case is generated from TSX using the AM62L footprint from the
          tscircuit/core progressive-fanout repro. Four perimeter balls escape
          toward one side, with left/center/right or top/center/bottom offsets.
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {FANOUT_DIRECTION_CASES.map((directionCase, caseIndex) => {
            const selected = caseIndex === selectedCaseIndex
            const color = directionColors[directionCase.majorityDirection]
            return (
              <button
                key={directionCase.exitPosition}
                type="button"
                onClick={() => setSelectedCaseIndex(caseIndex)}
                style={{
                  background: selected ? color : "#ffffff",
                  border: `1px solid ${selected ? color : "#cbd5e1"}`,
                  borderRadius: 999,
                  color: selected ? "#ffffff" : "#334155",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: selected ? 700 : 500,
                  padding: "6px 10px",
                }}
              >
                {directionCase.name}
              </button>
            )
          })}
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
              background: directionColors[selectedCase.majorityDirection],
              borderRadius: 999,
              color: "#ffffff",
              fontWeight: 700,
              padding: "4px 8px",
              textTransform: "uppercase",
            }}
          >
            majority {selectedCase.majorityDirection}
          </span>
          <code>{selectedCase.exitPosition}</code>
          <span style={{ color: "#475569" }}>{sample.description}</span>
        </div>
      </header>

      <GenericSolverDebugger
        key={sample.id}
        createSolver={() =>
          new FanoutSolver(sample.simpleRouteJson, sample.solverOptions)
        }
        animationSpeed={80}
      />
    </div>
  )
}
