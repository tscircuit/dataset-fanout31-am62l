import { T113s3FanoutDebugger } from "../lib/t113s3-fanout-debugger"
import { createSample } from "../samples/60-t113s3-left-top-offset"

export default function T113s3LeftTopOffsetPage() {
  return <T113s3FanoutDebugger createSample={createSample} />
}
