import { T113s3FanoutDebugger } from "../lib/t113s3-fanout-debugger"
import { createSample } from "../samples/51-t113s3-top-right-offset"

export default function T113s3TopRightOffsetPage() {
  return <T113s3FanoutDebugger createSample={createSample} />
}
