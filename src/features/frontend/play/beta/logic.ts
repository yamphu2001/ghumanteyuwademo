// logic.ts — BugReportModal positioning
// Mirrors the OneHandedMenu getLayout pattern, driven by User_Ui_Preference

export type HandPreference = "left" | "right" | "center";

export interface BugButtonLayout {
  position: string;
  style?: React.CSSProperties;
  modalOrigin: "bottom-left" | "bottom-right" | "bottom-center";
  iconOnly?: boolean;
}

const LAYOUTS: Record<HandPreference, BugButtonLayout> = {
  right: {
    position: "fixed bottom-6 left-6",
    modalOrigin: "bottom-left",
  },
  left: {
    position: "fixed bottom-6 right-6",
    modalOrigin: "bottom-right",
  },
  center: {
    position: "fixed bottom-30 left-1/2 -translate-x-1/2",
    modalOrigin: "bottom-center",
    iconOnly: true,
  },
};

export function getBugReportLayout(hand: HandPreference): BugButtonLayout {
  return LAYOUTS[hand] ?? LAYOUTS.right;
}

// All preferences show a centered full-screen modal — only the trigger button position differs
export function getModalAlignment(_origin: BugButtonLayout["modalOrigin"]): string {
  return "items-center justify-center";
}