import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import type { FontAwesomeIconStyle } from "@fortawesome/react-native-fontawesome";
import { useThemeColor } from "@/hooks/use-theme-color";

type Props = {
  name: IconProp;
  size?: number;
  color?: string;
  style?: FontAwesomeIconStyle;
};

export function AppIcon({ name, size = 18, color, style }: Props) {
  const textColor = useThemeColor({}, "text");
  return (
    <FontAwesomeIcon
      icon={name}
      size={size}
      color={color ?? textColor}
      style={style}
    />
  );
}