import { T113s3FanoutDebugger } from "../lib/t113s3-fanout-debugger"
import { createSample } from "../samples/55-t113s3-bottom-right-offset"

export default function T113s3BottomRightOffsetPage() {
  return <T113s3FanoutDebugger createSample={createSample} />
}
