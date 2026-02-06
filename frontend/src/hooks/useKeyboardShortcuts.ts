import { useEffect, useRef } from 'react';

export interface KeyboardShortcutHandlers {
  onF1?: () => void;
  onF2?: () => void;
  onF3?: () => void;
  onF4?: () => void;
  onF5?: () => void;
  onF6?: () => void;
  onF7?: () => void;
  onF8?: () => void;
  onF9?: () => void;
  onF10?: () => void;
  onF11?: () => void;
  onF12?: () => void;
  onEscape?: () => void;
  /** Tab key – e.g. select Cash payment */
  onKeyTab?: () => void;
  /** Enter key – e.g. complete payment */
  onEnter?: () => void;
}

export interface UseKeyboardShortcutsOptions {
  handlers: KeyboardShortcutHandlers;
  enabled?: boolean;
  disabledWhen?: {
    modalsOpen?: boolean;
    processing?: boolean;
    inputFocused?: boolean;
  };
}

export function useKeyboardShortcuts({
  handlers,
  enabled = true,
  disabledWhen,
}: UseKeyboardShortcutsOptions) {
  const handlersRef = useRef(handlers);
  const disabledWhenRef = useRef(disabledWhen);

  // Update refs when props change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    disabledWhenRef.current = disabledWhen;
  }, [disabledWhen]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if shortcuts should be disabled
      const disabled = disabledWhenRef.current;
      if (disabled) {
        // Don't trigger shortcuts if modals are open
        if (disabled.modalsOpen) return;
        
        // Don't trigger shortcuts if processing
        if (disabled.processing) return;
        
        // Don't trigger shortcuts if user is typing in input/textarea/select
        if (disabled.inputFocused) {
          const target = event.target as HTMLElement;
          const isInputElement = 
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable;
          
          if (isInputElement) return;
        }
      }

      // Check if user is typing in any input (fallback check)
      const target = event.target as HTMLElement;
      const isInputElement = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // Don't trigger shortcuts when typing in inputs (unless explicitly allowed)
      if (isInputElement && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // Allow Escape key to close modals even when input is focused
        if (event.key === 'Escape' && handlersRef.current.onEscape) {
          event.preventDefault();
          handlersRef.current.onEscape();
        }
        return;
      }

      // Handle function keys (F1-F12)
      // Support both regular F-keys and Fn+F-keys (for laptops)
      const key = event.key;
      let functionKey: number | null = null;

      if (key.startsWith('F') && key.length <= 3) {
        // Regular F-key (F1, F2, etc.)
        const match = key.match(/F(\d+)/);
        if (match) {
          functionKey = parseInt(match[1], 10);
        }
      } else if (key === 'Escape') {
        if (handlersRef.current.onEscape) {
          event.preventDefault();
          handlersRef.current.onEscape();
        }
        return;
      } else if (key === 'Tab') {
        if (handlersRef.current.onKeyTab) {
          event.preventDefault();
          handlersRef.current.onKeyTab();
        }
        return;
      } else if (key === 'Enter') {
        if (handlersRef.current.onEnter) {
          event.preventDefault();
          handlersRef.current.onEnter();
        }
        return;
      }

      if (functionKey && functionKey >= 1 && functionKey <= 12) {
        // Prevent default browser behavior for function keys
        event.preventDefault();
        
        // Call the appropriate handler
        const handlerMap: Record<number, (() => void) | undefined> = {
          1: handlersRef.current.onF1,
          2: handlersRef.current.onF2,
          3: handlersRef.current.onF3,
          4: handlersRef.current.onF4,
          5: handlersRef.current.onF5,
          6: handlersRef.current.onF6,
          7: handlersRef.current.onF7,
          8: handlersRef.current.onF8,
          9: handlersRef.current.onF9,
          10: handlersRef.current.onF10,
          11: handlersRef.current.onF11,
          12: handlersRef.current.onF12,
        };

        const handler = handlerMap[functionKey];
        if (handler) {
          handler();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);
}

