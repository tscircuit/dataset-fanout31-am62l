# dataset-fanout31-am62l

Twelve TSX-generated fanout problems for the 373-ball
`AM62L32BOGHAANBR` FCCSP package. The cases cover all canonical directional
edge positions in `@tscircuit/fanout-solver`:

- majority up: top edge, left/center/right bands
- majority right: right edge, top/center/bottom bands
- majority down: bottom edge, right/center/left bands
- majority left: left edge, bottom/center/top bands

The AM62L footprint is copied from
`tscircuit/core/tests/repros/repro-am62l-lpddr4-progressive-fanout.test.tsx`.
Each case is displayed through `GenericSolverDebugger` in the exported React
Cosmos site.

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
