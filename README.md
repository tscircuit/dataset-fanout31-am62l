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
bun run typecheck
bun run format:check
bun run build:site
```
AM62L BGA fanout dataset covering all 12 directional boundary exits
