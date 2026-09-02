# dataset-fanout31-am62l

Twelve TSX-generated fanout problems for the 373-ball
`AM62L32BOGHAANBR` FCCSP package. Every case contains the complete SoC fanout
workload from tscircuit/core: 33 DDR connections in nine signal buses, three
differential pairs, and 102 single-connection plane-drop buses. That is 135
connections and 111 buses per case on the original eight-layer stackup.

The cases cover all canonical directional edge positions in
`@tscircuit/fanout-solver`:

- majority up: top edge, left/center/right bands
- majority right: right edge, top/center/bottom bands
- majority down: bottom edge, right/center/left bands
- majority left: left edge, bottom/center/top bands

Each problem has its own source circuit in `samples/*.tsx` and its own
independently selectable `pages/*.page.tsx` Cosmos fixture. Run
`bun run solve-count` to execute all 12 complete problems with a 60-second
timeout per sample and report the current solver success count.

With `@tscircuit/fanout-solver@0.0.49`, the current bounded result is **0/12
solved**: every complete 135-connection problem reaches the 60-second timeout.

The AM62L footprint, signal assignments, preferred layers, length-skew limits,
differential pairs, GND/VDDS_DDR plane drops, and plane-drop directions are
copied from the fixture behind
`tscircuit/core/tests/repros/repro-am62l-lpddr4-progressive-fanout.test.tsx`.
The two DMI buses come from the RAM-above variant of that same fixture, making
this dataset a superset of its default seven-signal-bus test. Each case is
displayed through `GenericSolverDebugger` in the exported React Cosmos site.

## Development

```sh
bun install
bun run start
bun test
bun run solve-count
bun run typecheck
bun run format:check
bun run build:site
```
AM62L BGA fanout dataset covering all 12 directional boundary exits
