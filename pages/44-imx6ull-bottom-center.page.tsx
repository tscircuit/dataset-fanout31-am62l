import { Imx6ullFanoutDebugger } from "../lib/imx6ull-fanout-debugger"
import { createSample } from "../samples/44-imx6ull-bottom-center"

export default function Imx6ullBottomCenterPage() {
  return <Imx6ullFanoutDebugger createSample={createSample} />
}
