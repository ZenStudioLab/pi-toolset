// Structural source-host preferences; the extension neither reads nor persists settings.
export interface ActivityIndicatorPreferences {
  enabled: boolean;
  text: "whimsical" | "operational" | "both";
  animation:
    | "asterisk"
    | "braille"
    | "dots"
    | "orbit"
    | "arc"
    | "diamond"
    | "pulse"
    | "blocks"
    | "classic"
    | "bounce"
    | "random";
  randomTiming: "once-per-run" | "periodically";
  color: "theme" | "claude";
  motion: "normal" | "reduced" | "plain";
  ascii: boolean;
  showElapsed: boolean;
  showAction: boolean;
  showOutputTokens: boolean;
}

export interface ActivityDecorationOverrides {
  enabled?: false;
  motion?: ActivityIndicatorPreferences["motion"];
  ascii?: boolean;
}

/** Absent flags inherit native settings; false boolean defaults are not invocation overrides. */
export function activityOverrides(
  disabled: boolean | string | undefined,
  display: boolean | string | undefined,
  ascii: boolean | string | undefined,
): ActivityDecorationOverrides | undefined {
  if (disabled === true) return { enabled: false };
  if (
    display !== undefined &&
    display !== "normal" &&
    display !== "reduced" &&
    display !== "plain"
  )
    return undefined;
  return {
    ...(display === undefined ? {} : { motion: display }),
    ...(ascii === true ? { ascii: true } : {}),
  };
}
