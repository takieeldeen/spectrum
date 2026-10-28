import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { Snackbar, SnackbarVariant } from "./snackbar";

/* ==========================================================================
   1. TYPES & INTERFACES
   ========================================================================== */

export interface SnackbarOptions {
  variant?: SnackbarVariant;
  autoHideDuration?: number;
  position?: "top" | "bottom";
  onClose?: () => void;
}

export interface SnackbarContextValue {
  /**
   * Shows a snackbar notification with the given message and options
   */
  showSnackbar: (message: string, options?: SnackbarOptions) => void;

  /**
   * Immediately hides the currently active snackbar
   */
  hideSnackbar: () => void;

  /**
   * Convenience helper to show a success snackbar
   */
  success: (
    message: string,
    options?: Omit<SnackbarOptions, "variant">
  ) => void;

  /**
   * Convenience helper to show an error snackbar
   */
  error: (
    message: string,
    options?: Omit<SnackbarOptions, "variant">
  ) => void;

  /**
   * Convenience helper to show a warning snackbar
   */
  warning: (
    message: string,
    options?: Omit<SnackbarOptions, "variant">
  ) => void;

  /**
   * Convenience helper to show an info snackbar
   */
  info: (
    message: string,
    options?: Omit<SnackbarOptions, "variant">
  ) => void;
}

interface SnackbarState {
  open: boolean;
  message: string;
  variant: SnackbarVariant;
  autoHideDuration: number;
  position: "top" | "bottom";
  onCloseCallback?: () => void;
  key: number;
}

/* ==========================================================================
   2. CONTEXT
   ========================================================================== */

const SnackbarContext = createContext<SnackbarContextValue | undefined>(
  undefined
);

/* ==========================================================================
   3. PROVIDER COMPONENT
   ========================================================================== */

export interface SnackbarProviderProps {
  children: ReactNode;
  defaultAutoHideDuration?: number;
  defaultPosition?: "top" | "bottom";
}

export function SnackbarProvider({
  children,
  defaultAutoHideDuration = 3000,
  defaultPosition = "top",
}: SnackbarProviderProps) {
  const [state, setState] = useState<SnackbarState>({
    open: false,
    message: "",
    variant: "success",
    autoHideDuration: defaultAutoHideDuration,
    position: defaultPosition,
    key: 0,
  });

  const hideSnackbar = useCallback(() => {
    setState((prev) => {
      prev.onCloseCallback?.();
      return { ...prev, open: false };
    });
  }, []);

  const showSnackbar = useCallback(
    (message: string, options?: SnackbarOptions) => {
      setState((prev) => ({
        open: true,
        message,
        variant: options?.variant || "success",
        autoHideDuration:
          options?.autoHideDuration ?? defaultAutoHideDuration,
        position: options?.position || defaultPosition,
        onCloseCallback: options?.onClose,
        key: prev.key + 1,
      }));
    },
    [defaultAutoHideDuration, defaultPosition]
  );

  const success = useCallback(
    (message: string, options?: Omit<SnackbarOptions, "variant">) => {
      showSnackbar(message, { ...options, variant: "success" });
    },
    [showSnackbar]
  );

  const error = useCallback(
    (message: string, options?: Omit<SnackbarOptions, "variant">) => {
      showSnackbar(message, { ...options, variant: "error" });
    },
    [showSnackbar]
  );

  const warning = useCallback(
    (message: string, options?: Omit<SnackbarOptions, "variant">) => {
      showSnackbar(message, { ...options, variant: "warning" });
    },
    [showSnackbar]
  );

  const info = useCallback(
    (message: string, options?: Omit<SnackbarOptions, "variant">) => {
      showSnackbar(message, { ...options, variant: "info" });
    },
    [showSnackbar]
  );

  const value = useMemo(
    () => ({
      showSnackbar,
      hideSnackbar,
      success,
      error,
      warning,
      info,
    }),
    [showSnackbar, hideSnackbar, success, error, warning, info]
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        key={state.key}
        open={state.open}
        message={state.message}
        variant={state.variant}
        position={state.position}
        autoHideDuration={state.autoHideDuration}
        onClose={hideSnackbar}
      />
    </SnackbarContext.Provider>
  );
}

/* ==========================================================================
   4. HOOK
   ========================================================================== */

/**
 * Hook to access snackbar triggers from anywhere in the component tree
 */
export function useSnackbar(): SnackbarContextValue {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
}

export default SnackbarProvider;
