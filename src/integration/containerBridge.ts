export type ContainerEvent =
  | {
      type: "segment_complete";
      payload: { letterId: string; segmentIndex: number };
    }
  | {
      type: "letter_complete";
      payload: { letterId: string };
    }
  | {
      type: "session_complete";
      payload: { lettersCompleted: number };
    };

export interface ContainerMessage {
  source: "tracing-game";
  protocolVersion: 1;
  event: ContainerEvent["type"];
  payload: ContainerEvent["payload"];
}

/**
 * The target origin is intentionally configurable because the container contract
 * is not finalized and packaged games may run from file://.
 */
export function emitContainerEvent(event: ContainerEvent): void {
  if (window.parent === window) return;

  const targetOrigin =
    new URLSearchParams(window.location.search).get("containerOrigin") ?? "*";
  const message: ContainerMessage = {
    source: "tracing-game",
    protocolVersion: 1,
    event: event.type,
    payload: event.payload,
  };

  window.parent.postMessage(message, targetOrigin);
}
