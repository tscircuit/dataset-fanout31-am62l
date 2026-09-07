import { T113s3FanoutDebugger } from "../lib/t113s3-fanout-debugger"
import { createSample } from "../samples/57-t113s3-bottom-left-offset"

export default function T113s3BottomLeftOffsetPage() {
  return <T113s3FanoutDebugger createSample={createSample} />
}
