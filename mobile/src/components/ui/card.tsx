import React from "react";
import {
  View,
  Pressable,
  StyleSheet,
  ViewProps,
  ViewStyle,
  StyleProp,
  Platform,
  PressableProps,
} from "react-native";
import { Image, ImageProps, ImageSource } from "expo-image";
import { useTranslation } from "react-i18next";

import { ThemedText, ThemedTextProps } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/* ==========================================================================
   1. TYPES & INTERFACES
   ========================================================================== */

export type CardVariant = "elevation" | "outlined";

export interface CardProps extends ViewProps {
  /**
   * The variant to use:
   * - `elevation`: displays shadows based on the elevation level.
   * - `outlined`: displays a subtle border with 0 elevation.
   * @default 'elevation'
   */
  variant?: CardVariant;

  /**
   * Shadow elevation depth (0 to 8).
   * Affects Android `elevation` and iOS `shadow*` styles.
   * @default 1
   */
  elevation?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

  /**
   * Corner radius of the card.
   * @default 16
   */
  borderRadius?: number;

  /**
   * Custom background color. Defaults to theme `backgroundElement`.
   */
  backgroundColor?: string;

  children?: React.ReactNode;
}

export interface CardHeaderProps extends ViewProps {
  /** Element placed at the start (usually an Avatar, Icon, or Badge). */
  avatar?: React.ReactNode;
  /** Primary title string or React component. */
  title: React.ReactNode;
  /** Secondary subtitle string or React component. */
  subheader?: React.ReactNode;
  /** Element placed at the end (usually an IconButton or Menu). */
  action?: React.ReactNode;
  /** Custom props passed to the title ThemedText component when title is a string. */
  titleTypographyProps?: Partial<ThemedTextProps>;
  /** Custom props passed to the subheader ThemedText component when subheader is a string. */
  subheaderTypographyProps?: Partial<ThemedTextProps>;
}

export interface CardMediaProps extends Omit<ImageProps, "source"> {
  /** Image source (URL string, local require(), or ImageSource object). */
  source: string | number | ImageSource;
  /** Fixed media height. @default 180 */
  height?: number;
  /** Optional overlay or media content. */
  children?: React.ReactNode;
}

export interface CardContentProps extends ViewProps {
  children?: React.ReactNode;
}

export interface CardActionsProps extends ViewProps {
  /** If true, removes horizontal & vertical padding. */
  disableSpacing?: boolean;
  /** Alignment of children actions. @default 'start' */
  align?: "start" | "center" | "end" | "space-between";
  children?: React.ReactNode;
}

export interface CardActionAreaProps extends PressableProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  rippleColor?: string;
}

/* ==========================================================================
   2. SHADOW / ELEVATION HELPERS (Cross-Platform Android & iOS)
   ========================================================================== */

function getElevationStyle(
  elevation: number,
  isDark: boolean,
  borderSelected: string,
): ViewStyle {
  if (elevation <= 0) {
    return {
      elevation: 0,
      shadowOpacity: 0,
    };
  }

  // Multi-tier elevation mapping for iOS and Android
  const shadowOpacity = Math.min(0.08 + elevation * 0.04, 0.35);
  const shadowRadius = elevation * 3;
  const shadowOffsetHeight = Math.ceil(elevation * 1.5);

  return {
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: shadowOffsetHeight },
        shadowOpacity,
        shadowRadius,
      },
      android: {
        elevation: Math.min(elevation * 2, 12),
      },
      default: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: shadowOffsetHeight },
        shadowOpacity,
        shadowRadius,
      },
    }),
    // In dark mode, a hairline border adds crisp visual separation like MUI dark surfaces
    borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
    borderColor: isDark ? borderSelected : "transparent",
  };
}

/* ==========================================================================
   3. COMPONENTS
   ========================================================================== */

/**
 * MUI-inspired Card container component.
 * Adapts seamlessly across Android, iOS, and Web with dark mode and RTL support.
 */
export function Card({
  variant = "elevation",
  elevation = 1,
  borderRadius = 16,
  backgroundColor,
  style,
  children,
  ...rest
}: CardProps) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar") ?? false;
  const isDark = theme.isDark;

  const cardBackground = backgroundColor ?? theme.backgroundElement;

  const variantStyle: ViewStyle =
    variant === "outlined"
      ? {
          borderWidth: 1,
          borderColor: theme.backgroundSelected,
          elevation: 0,
          shadowOpacity: 0,
        }
      : getElevationStyle(elevation, isDark, theme.backgroundSelected);

  return (
    <View
      style={[
        styles.cardRoot,
        {
          backgroundColor: cardBackground,
          borderRadius,
          direction: isArabic ? "rtl" : "ltr",
        },
        variantStyle,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

/**
 * Optional interactive wrapper for Card with Android ripple and iOS press highlight.
 */
export function CardActionArea({
  children,
  style,
  rippleColor,
  disabled,
  ...rest
}: CardActionAreaProps) {
  const theme = useTheme();

  return (
    <Pressable
      disabled={disabled}
      android_ripple={{
        color: rippleColor ?? `${theme.primary}20`,
        borderless: false,
      }}
      style={({ pressed }) => [
        styles.actionArea,
        pressed && Platform.OS === "ios" && { opacity: 0.85 },
        typeof style === "function" ? (style as any)({ pressed }) : style,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

/**
 * Card Header with Avatar, Title, Subheader, and Action slots.
 */
export function CardHeader({
  avatar,
  title,
  subheader,
  action,
  titleTypographyProps,
  subheaderTypographyProps,
  style,
  ...rest
}: CardHeaderProps) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar") ?? false;

  return (
    <View
      style={[
        styles.headerRoot,
        { flexDirection: "row" },
        style,
      ]}
      {...rest}
    >
      {avatar && <View style={styles.headerAvatar}>{avatar}</View>}

      <View style={styles.headerContent}>
        {typeof title === "string" ? (
          <ThemedText
            type="default"
            weight="600"
            style={[styles.headerTitle, { textAlign: isArabic ? "right" : "left" }]}
            {...titleTypographyProps}
          >
            {title}
          </ThemedText>
        ) : (
          title
        )}

        {subheader &&
          (typeof subheader === "string" ? (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={[
                styles.headerSubheader,
                { textAlign: isArabic ? "right" : "left" },
              ]}
              {...subheaderTypographyProps}
            >
              {subheader}
            </ThemedText>
          ) : (
            subheader
          ))}
      </View>

      {action && <View style={styles.headerAction}>{action}</View>}
    </View>
  );
}

/**
 * Card Media component for displaying images, graphics, or cover banners.
 */
export function CardMedia({
  source,
  height = 180,
  contentFit = "cover",
  style,
  children,
  ...rest
}: CardMediaProps) {
  return (
    <View style={[styles.mediaContainer, { height }]}>
      <Image
        source={source}
        contentFit={contentFit}
        transition={250}
        style={[styles.mediaImage, style]}
        {...rest}
      />
      {children && <View style={styles.mediaOverlay}>{children}</View>}
    </View>
  );
}

/**
 * Card Content wrapper providing standard inner padding for text and controls.
 */
export function CardContent({ style, children, ...rest }: CardContentProps) {
  return (
    <View style={[styles.contentRoot, style]} {...rest}>
      {children}
    </View>
  );
}

/**
 * Card Actions bar for bottom buttons and interactive elements.
 */
export function CardActions({
  disableSpacing = false,
  align = "start",
  style,
  children,
  ...rest
}: CardActionsProps) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar") ?? false;

  const resolveJustify = () => {
    switch (align) {
      case "center":
        return "center";
      case "end":
        return "flex-end";
      case "space-between":
        return "space-between";
      case "start":
      default:
        return "flex-start";
    }
  };

  return (
    <View
      style={[
        styles.actionsRoot,
        !disableSpacing && styles.actionsPadding,
        {
          justifyContent: resolveJustify(),
          flexDirection: "row",
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

/* ==========================================================================
   4. COMPONENT COMPOSITION ATTACHMENTS (MUI Syntax: Card.Header, Card.Content)
   ========================================================================== */

Card.Header = CardHeader;
Card.Media = CardMedia;
Card.Content = CardContent;
Card.Actions = CardActions;
Card.ActionArea = CardActionArea;

export default Card;

/* ==========================================================================
   5. STYLES
   ========================================================================== */

const styles = StyleSheet.create({
  cardRoot: {
    overflow: "hidden",
    marginVertical: Spacing.two,
  },
  actionArea: {
    width: "100%",
  },
  headerRoot: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    alignItems: "center",
    gap: Spacing.three,
  },
  headerAvatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  headerSubheader: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  headerAction: {
    alignSelf: "flex-start",
    marginTop: -2,
  },
  mediaContainer: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  mediaOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    padding: Spacing.three,
  },
  contentRoot: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  actionsRoot: {
    alignItems: "center",
    gap: Spacing.two,
  },
  actionsPadding: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    paddingTop: Spacing.one,
  },
});
