import { T113s3FanoutDebugger } from "../lib/t113s3-fanout-debugger"
import { createSample } from "../samples/59-t113s3-left-center"

export default function T113s3LeftCenterPage() {
  return <T113s3FanoutDebugger createSample={createSample} />
}
