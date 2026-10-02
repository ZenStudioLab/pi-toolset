import { readFileSync } from "node:fs";

/** One asset load per selector; keep this instance across ordinary runs in the UI runtime. */
export class ActivityWordSelector {
  readonly words: readonly string[];
  readonly maxWordLength: number;
  /** Consume once through the host's existing diagnostic path, not on each selection. */
  readonly diagnostic?: string;
  private readonly random: () => number;
  private bag: number[] = [];
  private cursor = 0;
  private lastIndex: number | undefined;

  constructor(
    random: () => number = Math.random,
    readAsset: () => string = () => readFileSync(new URL("./activity-words.json", import.meta.url), "utf8"),
  ) {
    this.random = random;
    try {
      const data: unknown = JSON.parse(readAsset());
      if (
        typeof data !== "object" || data === null ||
        !("schemaVersion" in data) || data.schemaVersion !== 1 ||
        !("locale" in data) || data.locale !== "en" ||
        !("words" in data) || !Array.isArray(data.words) || data.words.length === 0
      ) {
        throw new Error("Invalid activity word bank schema or locale");
      }
      const entries: unknown[] = data.words;
      const words: string[] = [];
      const seen = new Set<string>();
      let maxWordLength = 0;
      for (const word of entries) {
        if (typeof word !== "string" || word.trim() !== word || word.length > 24 || !/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/.test(word)) {
          throw new Error("Invalid activity word bank entry");
        }
        const key = word.toLowerCase();
        if (seen.has(key)) throw new Error("Duplicate activity word bank entry");
        seen.add(key);
        words.push(word);
        maxWordLength = Math.max(maxWordLength, word.length);
      }
      this.words = Object.freeze(words);
      this.maxWordLength = maxWordLength;
    } catch {
      this.words = Object.freeze(["Working"]);
      this.maxWordLength = "Working".length;
      this.diagnostic = "Whimsical activity word bank is invalid or unavailable; using Working.";
    }
  }

  next(): string {
    if (this.words.length === 1) return this.words[0];
    if (this.cursor === this.bag.length) {
      this.bag = this.words.map((_, index) => index);
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
      // Repair the boundary without retrying or consuming another entry.
      if (this.bag[0] === this.lastIndex) {
        [this.bag[0], this.bag[1]] = [this.bag[1], this.bag[0]];
      }
      this.cursor = 0;
    }
    const index = this.bag[this.cursor++];
    this.lastIndex = index;
    return this.words[index];
  }
}
