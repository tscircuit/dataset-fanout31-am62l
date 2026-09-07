import { T113s3FanoutDebugger } from "../lib/t113s3-fanout-debugger"
import { createSample } from "../samples/50-t113s3-top-center"

export default function T113s3TopCenterPage() {
  return <T113s3FanoutDebugger createSample={createSample} />
}
