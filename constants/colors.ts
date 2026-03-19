// constants/Colors.ts

import { Button } from "@react-navigation/elements";

export const Colors = {
  light: {
    background: "#F5EEEE",      // LIGHT_BG
    text: "#402F1C",            // TEXT_DARK
    surface: "#634c31",         // small cards
    coffee: "#3C2C24",          // DARK_COFFEE
    accent: "#D4AF7A",          // TAN_BUTTON
    placeholder: "#D3D3D3",
    border: "#634c31",
    button: "#634c31"
  },

  dark: {
    background: "#1D1D1D",      // dark base
    text: "#F5F5F5",
    surface: "#2A211C",         // dark card surface (coffee tone)
    coffee: "#3C2C24",
    accent: "#D4AF7A",
    placeholder: "#3A3A3A",
    border: "rgba(255,255,255,0.15)",
  },
} as const;

export default Colors