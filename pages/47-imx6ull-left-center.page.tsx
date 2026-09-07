import { Imx6ullFanoutDebugger } from "../lib/imx6ull-fanout-debugger"
import { createSample } from "../samples/47-imx6ull-left-center"

export default function Imx6ullLeftCenterPage() {
  return <Imx6ullFanoutDebugger createSample={createSample} />
}
