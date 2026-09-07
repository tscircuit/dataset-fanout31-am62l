import { Imx6ullFanoutDebugger } from "../lib/imx6ull-fanout-debugger"
import { createSample } from "../samples/41-imx6ull-right-center"

export default function Imx6ullRightCenterPage() {
  return <Imx6ullFanoutDebugger createSample={createSample} />
}
