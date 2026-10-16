import type { CompactionPreparation } from "../../extensions/compaction-model/thinking.ts";

/** A small preparation as Pi builds it; tests override only what they exercise. */
export function preparation(text = "fix the build", overrides: Partial<CompactionPreparation> = {}): CompactionPreparation {
  return {
    firstKeptEntryId: "kept",
    messagesToSummarize: [{ role: "user", content: text, timestamp: 1 }],
    turnPrefixMessages: [],
    isSplitTurn: false,
    tokensBefore: 1000,
    fileOps: { read: new Set(["a.ts"]), written: new Set(["b.ts"]), edited: new Set(["b.ts", "c.ts"]) },
    settings: { enabled: true, reserveTokens: 16_384, keepRecentTokens: 20_000 },
    ...overrides,
  } as CompactionPreparation;
}
