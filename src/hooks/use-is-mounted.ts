import * as React from "react";

const emptySubscribe = () => () => {};

export function useIsMounted(): boolean {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
