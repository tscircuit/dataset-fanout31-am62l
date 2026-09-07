import { T113s3FanoutDebugger } from "../lib/t113s3-fanout-debugger"
import { createSample } from "../samples/49-t113s3-top-left-offset"

export default function T113s3TopLeftOffsetPage() {
  return <T113s3FanoutDebugger createSample={createSample} />
}
