import Svg, { Rect } from "react-native-svg";

export default function DashboardIcon({ size = 24, color = "#000" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="13" y="11" width="8" height="10" rx="1" ry="1" fill={color} />
      <Rect x="3" y="15" width="8" height="6" rx="1" ry="1" fill={color} />
      <Rect x="13" y="3" width="8" height="6" rx="1" ry="1" fill={color} />
      <Rect x="3" y="3" width="8" height="10" rx="1" ry="1" fill={color} />
    </Svg>
  );
}