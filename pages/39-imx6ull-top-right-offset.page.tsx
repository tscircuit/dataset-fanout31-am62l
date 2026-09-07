import { Imx6ullFanoutDebugger } from "../lib/imx6ull-fanout-debugger"
import { createSample } from "../samples/39-imx6ull-top-right-offset"

export default function Imx6ullTopRightOffsetPage() {
  return <Imx6ullFanoutDebugger createSample={createSample} />
}
