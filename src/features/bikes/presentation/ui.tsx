import React, { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export const colors = {
  ink: "#17353A",
  green: "#2F7D62",
  lime: "#C9E265",
  sand: "#F5F1E7",
  white: "#FFFFFF",
  red: "#B94A3B",
  muted: "#627476",
  line: "#D8DED7",
};
export function Page({
  title,
  children,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  busy?: boolean;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.bar}>
        <Text accessibilityRole="header" style={styles.brand}>
          {title}
        </Text>
        {busy && (
          <ActivityIndicator
            accessibilityLabel="Cargando"
            color={colors.green}
          />
        )}
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.page}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Hero({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text accessibilityRole="header" style={styles.heroTitle}>
        {title}
      </Text>
      <Text style={styles.heroText}>{detail}</Text>
    </View>
  );
}
export function Card({
  children,
  onPress,
  label,
}: {
  children: ReactNode;
  onPress?: () => void;
  label?: string;
}) {
  const body = <View style={styles.card}>{children}</View>;
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
    >
      {body}
    </Pressable>
  ) : (
    body
  );
}
export function Button({
  label,
  onPress,
  disabled = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        secondary && styles.secondary,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryText]}>
        {label}
      </Text>
    </Pressable>
  );
}
export function Field(
  props: React.ComponentProps<typeof TextInput> & { label: string },
) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        accessibilityLabel={props.label}
        placeholderTextColor={colors.muted}
        {...props}
        style={styles.input}
      />
    </View>
  );
}
export function ErrorNotice({
  message,
  retry,
}: {
  message: string | null;
  retry?: () => void;
}) {
  if (!message) return null;
  return (
    <View accessibilityRole="alert" style={styles.error}>
      <Text style={styles.errorText}>{message}</Text>
      {retry && <Button label="Reintentar" onPress={retry} secondary />}
    </View>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.sand },
  bar: {
    minHeight: 58,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { fontSize: 20, fontWeight: "800", color: colors.ink },
  page: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 64,
    gap: 14,
  },
  hero: { backgroundColor: colors.ink, borderRadius: 28, padding: 24, gap: 8 },
  eyebrow: {
    color: colors.lime,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 34,
  },
  heroText: { color: "#DCE8E3", fontSize: 15, lineHeight: 21 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 8,
  },
  button: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.green,
  },
  disabled: { opacity: 0.45 },
  buttonText: { color: colors.white, fontWeight: "800", fontSize: 16 },
  secondaryText: { color: colors.green },
  field: { gap: 7 },
  label: { color: colors.ink, fontWeight: "700" },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    color: colors.ink,
  },
  error: { backgroundColor: "#FCEAE6", borderRadius: 14, padding: 14, gap: 10 },
  errorText: { color: colors.red, fontWeight: "700" },
});
