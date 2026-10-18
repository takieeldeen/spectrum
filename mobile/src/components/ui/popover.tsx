import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  Dimensions,
  ViewStyle,
  StyleProp,
  Platform,
  TouchableWithoutFeedback,
  LayoutChangeEvent,
  I18nManager,
} from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { Spacing } from "@/constants/theme";

/* ==========================================================================
   1. TYPES & INTERFACES
   ========================================================================== */

export type PopoverPlacement =
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end";

export interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UsePopoverReturn {
  open: boolean;
  anchorRef: React.RefObject<View | null>;
  anchorRect: AnchorRect | null;
  onOpen: (targetOrEvent?: any) => void;
  onClose: () => void;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface PopoverArrowProps {
  hide?: boolean;
  size?: number;
  color?: string;
}

export interface PopoverProps {
  /** If true, the popover is visible. */
  open: boolean;

  /** Callback fired when clicking the backdrop or requesting close. */
  onClose: () => void;

  /** Reference to the trigger view to position against. */
  anchorRef?: React.RefObject<View | null>;

  /** Measured coordinates of the anchor view. */
  anchorRect?: AnchorRect | null;

  /**
   * Placement relative to the anchor.
   * @default 'bottom-end'
   */
  placement?: PopoverPlacement;

  /** Arrow pointer configuration. */
  arrow?: PopoverArrowProps;

  /** Custom container style for the popover paper surface. */
  style?: StyleProp<ViewStyle>;

  /** Popover body content. */
  children?: React.ReactNode;
}

export interface PopoverItemProps {
  /** Optional icon placed at the start. */
  icon?: React.ReactNode;
  /** Label text or node. */
  children: React.ReactNode;
  /** Press handler. */
  onPress?: () => void;
  /** If true, highlights the item in red (for delete/destructive actions). */
  destructive?: boolean;
  /** If true, disables interaction. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/* ==========================================================================
   2. USE_POPOVER HOOK
   ========================================================================== */

export function usePopover(): UsePopoverReturn {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<View | null>(null);
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null);

  const onOpen = useCallback((targetOrEvent?: any) => {
    const target =
      anchorRef.current ||
      (targetOrEvent?.currentTarget && typeof targetOrEvent.currentTarget.measureInWindow === "function"
        ? targetOrEvent.currentTarget
        : null);

    console.log("🎯 ON_OPEN CALLED:", {
      hasAnchorRef: !!anchorRef.current,
      hasTarget: !!target,
      hasMeasure: typeof target?.measureInWindow,
    });

    if (target && typeof target.measureInWindow === "function") {
      target.measureInWindow((x: number, y: number, width: number, height: number) => {
        const measured = { x, y, width, height };
        console.log("🎯 MEASURED IN WINDOW:", measured);
        (anchorRef as any).currentRect = measured;
        setAnchorRect(measured);
        setOpen(true);
      });
    } else {
      console.log("🎯 MEASURE FAILED OR NO TARGET");
      setOpen(true);
    }
  }, []);

  const onClose = useCallback(() => {
    setOpen(false);
  }, []);

  return {
    open,
    anchorRef,
    anchorRect,
    onOpen,
    onClose,
    setOpen,
  };
}

/* ==========================================================================
   3. POPOVER COMPONENT
   ========================================================================== */

export function Popover({
  open,
  onClose,
  anchorRef,
  anchorRect: propAnchorRect,
  placement = "bottom-end",
  arrow,
  style,
  children,
}: PopoverProps) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar") ?? false;
  const isDark = theme.isDark;

  const [measuredRect, setMeasuredRect] = useState<AnchorRect | null>(
    propAnchorRect ?? (anchorRef as any)?.currentRect ?? null
  );
  const [contentSize, setContentSize] = useState<{ width: number; height: number }>({
    width: 170,
    height: 90,
  });

  // Sync prop changes
  useEffect(() => {
    if (propAnchorRect) {
      setMeasuredRect(propAnchorRect);
    } else if ((anchorRef as any)?.currentRect) {
      setMeasuredRect((anchorRef as any).currentRect);
    }
  }, [propAnchorRect, anchorRef]);

  // Measure anchorRef on open if not already measured
  useEffect(() => {
    if (open && anchorRef?.current && typeof anchorRef.current.measureInWindow === "function") {
      anchorRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          const rect = { x, y, width, height };
          (anchorRef as any).currentRect = rect;
          setMeasuredRect(rect);
        }
      });
    }
  }, [open, anchorRef]);

  const onLayoutContent = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setContentSize({ width, height });
    }
  }, []);

  if (!open) return null;

  const window = Dimensions.get("window");
  const screenWidth = window.width;
  const screenHeight = window.height;

  /* ------------------------------------------------------------------------
     CALCULATE POSITION & CLAMP TO SCREEN BOUNDS
     ------------------------------------------------------------------------ */
  const rect =
    measuredRect ||
    propAnchorRect ||
    (anchorRef as any)?.currentRect || {
      x: isArabic ? 24 : screenWidth - 64,
      y: 120,
      width: 40,
      height: 40,
    };

  const arrowSize = arrow?.size ?? 12;
  const arrowSpacing = arrow?.hide ? 6 : arrowSize + 4;

  let isTop = placement.startsWith("top");
  let top = isTop
    ? rect.y - contentSize.height - arrowSpacing
    : rect.y + rect.height + arrowSpacing;

  // Auto-flip vertical orientation if overflowing screen bottom
  if (!isTop && top + contentSize.height > screenHeight - 24) {
    top = Math.max(16, rect.y - contentSize.height - arrowSpacing);
    isTop = true;
  } else if (isTop && top < 24) {
    top = rect.y + rect.height + arrowSpacing;
    isTop = false;
  }

  /* ------------------------------------------------------------------------
     HORIZONTAL ALIGNMENT (RTL-AWARE)
     ------------------------------------------------------------------------ */
  let left = rect.x;
  const p = placement.toLowerCase();

  let alignRight = false;

  if (p.endsWith("center")) {
    left = rect.x + (rect.width - contentSize.width) / 2;
  } else if (p.endsWith("end")) {
    // In RTL, "end" aligns with the left edge of the anchor and opens rightwards.
    // In LTR, "end" aligns with the right edge of the anchor and opens leftwards.
    alignRight = !isArabic;
  } else if (p.endsWith("start")) {
    // In RTL, "start" aligns with the right edge of the anchor and opens leftwards.
    // In LTR, "start" aligns with the left edge of the anchor and opens rightwards.
    alignRight = isArabic;
  } else if (p.endsWith("right")) {
    alignRight = true;
  } else if (p.endsWith("left")) {
    alignRight = false;
  }

  if (alignRight) {
    left = rect.x + rect.width - contentSize.width;
  } else if (!p.endsWith("center")) {
    left = rect.x;
  }



  // Clamp horizontal coordinate inside visible screen
  const clampedPhysicalLeft = Math.max(12, Math.min(left, screenWidth - contentSize.width - 12));

  // Arrow position relative to physical popover left edge
  const anchorCenterX = rect.x + rect.width / 2;
  const rawArrowLeft = Math.max(
    14,
    Math.min(anchorCenterX - clampedPhysicalLeft - arrowSize / 2, contentSize.width - arrowSize - 14)
  );

  // In Android with I18nManager.isRTL = true, native ReactViewGroup mirrors `left` and `right`.
  // To place an element at physical X coordinate `clampedPhysicalLeft` from the left of the screen,
  // we invert it: `screenWidth - contentSize.width - clampedPhysicalLeft`.
  const isAndroidRTL = Platform.OS === "android" && I18nManager.isRTL;
  const finalLeft = isAndroidRTL
    ? screenWidth - contentSize.width - clampedPhysicalLeft
    : clampedPhysicalLeft;
  const finalArrowLeft = isAndroidRTL
    ? contentSize.width - rawArrowLeft - arrowSize
    : rawArrowLeft;

  const surfaceBg = isDark ? theme.backgroundElement : "#FFFFFF";
  const borderCol = isDark ? theme.backgroundSelected : "rgba(0, 0, 0, 0.08)";

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              onLayout={onLayoutContent}
              style={[
                styles.paper,
                {
                  top,
                  left: finalLeft,
                  backgroundColor: surfaceBg,
                  borderColor: borderCol,
                  direction: isArabic ? "rtl" : "ltr",
                },
                style,
              ]}
            >
              {/* Optional Arrow Pointer */}
              {!arrow?.hide && (
                <View
                  style={[
                    styles.arrow,
                    isTop ? styles.arrowBottom : styles.arrowTop,
                    {
                      left: finalArrowLeft,
                      backgroundColor: arrow?.color ?? surfaceBg,
                      borderColor: borderCol,
                    },
                  ]}
                />
              )}

              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

/* ==========================================================================
   4. POPOVER MENU ITEM
   ========================================================================== */

export function PopoverItem({
  icon,
  children,
  onPress,
  destructive = false,
  disabled = false,
  style,
}: PopoverItemProps) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar") ?? false;

  const itemColor = destructive ? "#EF4444" : theme.text;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      android_ripple={{
        color: destructive ? "rgba(239, 68, 68, 0.15)" : `${theme.primary}18`,
        borderless: false,
      }}
      style={({ pressed }) => [
        styles.itemRoot,
        {
          direction: isArabic ? "rtl" : "ltr",
          flexDirection: isArabic ? "row-reverse" : "row",
        },
        disabled && styles.itemDisabled,
        pressed && Platform.OS === "ios" && { opacity: 0.7 },
        style,
      ]}
    >
      {icon && <View style={styles.itemIcon}>{icon}</View>}

      <ThemedText
        type="small"
        weight="500"
        style={[
          styles.itemLabel,
          { color: itemColor, textAlign: isArabic ? "right" : "left" },
        ]}
      >
        {children}
      </ThemedText>
    </Pressable>
  );
}

/* ==========================================================================
   5. COMPOSITION ATTACHMENT & ALIASES
   ========================================================================== */

Popover.Item = PopoverItem;
export const CustomPopover = Popover;
export default Popover;

/* ==========================================================================
   6. STYLES
   ========================================================================== */

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "transparent",
  },
  paper: {
    position: "absolute",
    minWidth: 160,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  arrow: {
    position: "absolute",
    width: 12,
    height: 12,
    borderWidth: 1,
    transform: [{ rotate: "45deg" }],
    zIndex: 1,
  },
  arrowTop: {
    top: -6,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  arrowBottom: {
    bottom: -6,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  itemRoot: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    gap: 12,
  },
  itemIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  itemLabel: {
    fontSize: 14,
    flex: 1,
  },
  itemDisabled: {
    opacity: 0.45,
  },
});
