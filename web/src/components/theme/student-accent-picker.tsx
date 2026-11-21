"use client";

import { useT } from "@/components/i18n";
import { AccentPicker } from "./accent-picker";

/** Student-portal colour picker: labelled button, EN / HI text from the dictionary. */
export function StudentAccentPicker({ className }: { className?: string }) {
  const { t } = useT();
  const s = t.shell;
  return (
    <AccentPicker
      showLabel
      size="lg"
      className={className}
      labels={{ button: s.colour, title: s.colourTitle, hint: s.colourHint, selected: s.colourSelected, names: s.colours, navStyle: s.navStyle, navRedBlack: s.navRedBlack, navDark: s.navDark, navWhite: s.navWhite, navSoft: s.navSoft, navColour: s.navColour, bgVivid: s.bgVivid, looks: s.looks, lookNames: s.lookNames, background: s.background, bgSoft: s.bgSoft, bgPlain: s.bgPlain }}
    />
  );
}
