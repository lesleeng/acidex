import { View, type ViewProps } from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  colorName?: keyof typeof import("@/constants/colors").Colors.light;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  colorName = "background",
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    colorName
  );

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}