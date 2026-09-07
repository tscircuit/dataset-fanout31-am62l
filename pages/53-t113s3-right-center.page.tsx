import { T113s3FanoutDebugger } from "../lib/t113s3-fanout-debugger"
import { createSample } from "../samples/53-t113s3-right-center"

export default function T113s3RightCenterPage() {
  return <T113s3FanoutDebugger createSample={createSample} />
}
