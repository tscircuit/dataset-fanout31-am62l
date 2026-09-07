import { T113s3FanoutDebugger } from "../lib/t113s3-fanout-debugger"
import { createSample } from "../samples/56-t113s3-bottom-center"

export default function T113s3BottomCenterPage() {
  return <T113s3FanoutDebugger createSample={createSample} />
}
