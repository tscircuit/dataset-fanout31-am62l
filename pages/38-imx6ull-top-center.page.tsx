import { Imx6ullFanoutDebugger } from "../lib/imx6ull-fanout-debugger"
import { createSample } from "../samples/38-imx6ull-top-center"

export default function Imx6ullTopCenterPage() {
  return <Imx6ullFanoutDebugger createSample={createSample} />
}
