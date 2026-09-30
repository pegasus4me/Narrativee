type TransitionListener = (active: boolean) => void;

const listeners = new Set<TransitionListener>();

export function setTransitionActive(active: boolean): void {
  listeners.forEach((listener) => {
    try {
      listener(active);
    } catch {
      // Ignore listener errors
    }
  });
}

export function onTransitionChange(listener: TransitionListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
