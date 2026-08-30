/**
 * GradientButton - Nut bam voi gradient #FC475C -> #FC655A (tren xuong duoi)
 * Tai su dung toan app thay the cho nut accent don mau
 */
import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from "../constants/theme";

interface Props {
  onPress?: () => void;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  height?: number;
}

export const GradientButton: React.FC<Props> = ({
  onPress,
  label,
  icon,
  disabled,
  loading,
  style,
  labelStyle,
  height = 52,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.wrapper, { height }, style]}
    >
      <LinearGradient
        colors={[COLORS.gradientTop, COLORS.gradientBottom]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <View style={styles.row}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.label, labelStyle]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

/**
 * GradientPlayButton - Nut play tron voi gradient
 */
interface PlayBtnProps {
  onPress?: () => void;
  children: React.ReactNode;
  size?: number;
}

export const GradientPlayButton: React.FC<PlayBtnProps> = ({
  onPress,
  children,
  size = LAYOUT.iconButtonPlay,
}) => {
  const radius = size / 2;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.playWrapper, { width: size, height: size, borderRadius: radius }]}
    >
      <LinearGradient
        colors={[COLORS.gradientTop, COLORS.gradientBottom]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: LAYOUT.radiusFull,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: COLORS.gradientTop,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  iconWrap: {
    marginRight: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: "700",
    color: COLORS.white,
  },
  playWrapper: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    elevation: 8,
    shadowColor: COLORS.gradientTop,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
});
