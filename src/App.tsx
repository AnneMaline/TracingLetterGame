import { letters } from "./data/letterSegments";
import { TracingScreen } from "./modules/tracing/TracingScreen";

export default function App() {
  return <TracingScreen letters={letters} />;
}
