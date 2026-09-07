import { T113s3FanoutDebugger } from "../lib/t113s3-fanout-debugger"
import { createSample } from "../samples/58-t113s3-left-bottom-offset"

export default function T113s3LeftBottomOffsetPage() {
  return <T113s3FanoutDebugger createSample={createSample} />
}
