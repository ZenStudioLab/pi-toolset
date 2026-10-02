import type { ActivityWordSelector } from "./word-bank.ts";
import type {
  ActivityDecorationOverrides,
  ActivityIndicatorPreferences,
} from "./preferences.ts";

// Structural copy of the supported source host's core/extensions/activity-decoration.ts.
// Published 0.87.1 types do not contain this boundary; compatibility is checked against source in tests.
export interface ActivityDecorationSnapshot {
  readonly runId: symbol | undefined;
  readonly ownerGeneration: number;
  readonly kind:
    | "working"
    | "retry"
    | "compaction"
    | "branchSummary"
    | undefined;
  readonly genericWorking: boolean;
  readonly eligible: boolean;
  readonly visible: boolean;
  readonly waiting: boolean;
  readonly preferences: Readonly<ActivityIndicatorPreferences>;
}

export interface ActivityDecorationPresentation {
  label?: string;
  reservedWidth?: number;
  nativeTextFallback?: true;
  glyph: "animated" | "static" | "hidden";
}

export type ActivityDecorationUpdate = (
  presentation: ActivityDecorationPresentation,
) => boolean;
export interface ActivityDecorationController {
  onSnapshot(
    snapshot: ActivityDecorationSnapshot,
    update: ActivityDecorationUpdate,
  ): void;
  dispose(): void;
}
export interface ActivityDecorationUI {
  registerActivityDecoration(
    factory: () => ActivityDecorationController,
    overrides?: ActivityDecorationOverrides,
  ): (() => void) | undefined;
}

export interface ActivityScheduler {
  now(): number;
  schedule(callback: () => void, delayMs: number): () => void;
}

const scheduler: ActivityScheduler = {
  now: () => performance.now(),
  schedule: (callback, delayMs) => {
    const timer = setTimeout(callback, delayMs);
    return () => clearTimeout(timer);
  },
};

type WordSource = Pick<
  ActivityWordSelector,
  "next" | "maxWordLength" | "diagnostic"
>;

/** Owns one visibility/word callback; native snapshots and scoped handles remain display authority. */
export class ActivityController implements ActivityDecorationController {
  private readonly getSelector: () => WordSource;
  private readonly scheduler: ActivityScheduler;
  private selector: WordSource | undefined;
  private snapshot: ActivityDecorationSnapshot | undefined;
  private word: string | undefined;
  private fallbackShown = false;
  private update: ActivityDecorationUpdate | undefined;
  private active = false;
  private ready = false;
  private disposed = false;
  private visibilityDeadline: number | undefined;
  private wordDeadline: number | undefined;
  private timerDeadline: number | undefined;
  private timerToken: symbol | undefined;
  private cancelTimer: (() => void) | undefined;

  constructor(
    getSelector: () => WordSource,
    clock: ActivityScheduler = scheduler,
  ) {
    this.getSelector = getSelector;
    this.scheduler = clock;
  }

  onSnapshot(
    snapshot: ActivityDecorationSnapshot,
    update: ActivityDecorationUpdate,
  ): void {
    if (this.disposed) return;
    const previous = this.snapshot;
    if (snapshot.runId !== previous?.runId) {
      this.suspend();
      this.word = undefined;
      this.fallbackShown = false;
    }
    this.snapshot = snapshot;
    this.update = update;
    const preferences = snapshot.preferences;
    if (
      !snapshot.eligible ||
      !snapshot.visible ||
      snapshot.waiting ||
      !snapshot.runId ||
      !snapshot.kind ||
      !preferences.enabled
    ) {
      this.suspend();
      return;
    }
    if (preferences.motion === "plain") {
      this.suspend();
      this.apply();
      return;
    }
    if (!this.active) {
      this.active = true;
      this.ready = this.word !== undefined || this.fallbackShown;
      if (!this.ready) this.visibilityDeadline = this.scheduler.now() + 250;
    } else if (
      previous?.preferences.text === "operational" &&
      preferences.text !== "operational"
    ) {
      // An explicit text-mode change restores an existing word, or gives a never-shown word its own delay.
      this.ready = this.word !== undefined || this.fallbackShown;
      this.visibilityDeadline = this.ready
        ? undefined
        : this.scheduler.now() + 250;
    }
    if (preferences.text === "operational" || preferences.motion === "reduced")
      this.wordDeadline = undefined;
    this.refresh();
  }

  private presentation(): ActivityDecorationPresentation {
    const preferences = this.snapshot!.preferences;
    if (!this.active || !this.ready || preferences.motion === "plain")
      return { glyph: "hidden" };
    const glyph = preferences.motion === "reduced" ? "static" : "animated";
    if (preferences.text === "operational") return { glyph };
    if (this.fallbackShown) return { glyph, nativeTextFallback: true };
    if (this.word === undefined) return { glyph };
    const suffix = preferences.ascii ? "..." : "…";
    return {
      label: this.word + suffix,
      reservedWidth: this.selector!.maxWordLength + suffix.length,
      glyph,
    };
  }

  private apply(): boolean {
    const snapshot = this.snapshot;
    const update = this.update;
    if (!update?.(this.presentation())) {
      if (this.snapshot === snapshot && this.update === update) this.suspend();
      return false;
    }
    return true;
  }

  private refresh(): void {
    const snapshot = this.snapshot!;
    if (!this.apply() || this.snapshot !== snapshot || !this.active) return;
    const preferences = snapshot.preferences;
    if (
      this.ready &&
      preferences.text !== "operational" &&
      this.word === undefined &&
      !this.fallbackShown &&
      snapshot.genericWorking
    ) {
      this.selector ??= this.getSelector();
      // Diagnostics/host redraw can reenter. Revalidate authority before drawing from the bank.
      if (this.snapshot !== snapshot || !this.active || !this.apply()) return;
      if (this.snapshot !== snapshot || !this.active) return;
      if (this.selector.diagnostic) this.fallbackShown = true;
      else this.word = this.selector.next();
      if (!this.apply() || this.snapshot !== snapshot || !this.active) return;
    }
    if (
      this.ready &&
      this.word !== undefined &&
      preferences.text !== "operational" &&
      preferences.motion === "normal"
    ) {
      this.wordDeadline ??= this.scheduler.now() + 8000;
    }
    this.schedule();
  }

  private schedule(): void {
    const deadline = this.visibilityDeadline ?? this.wordDeadline;
    if (deadline === this.timerDeadline) return;
    this.clearTimer();
    if (deadline === undefined) return;
    const token = Symbol();
    const run = this.snapshot!.runId;
    this.timerToken = token;
    this.timerDeadline = deadline;
    this.cancelTimer = this.scheduler.schedule(
      () => {
        if (
          this.disposed ||
          !this.active ||
          this.timerToken !== token ||
          this.snapshot?.runId !== run
        )
          return;
        this.timerToken = undefined;
        this.timerDeadline = undefined;
        this.cancelTimer = undefined;
        if (this.scheduler.now() < deadline) {
          this.schedule();
          return;
        }
        if (this.visibilityDeadline === undefined) {
          const snapshot = this.snapshot;
          if (!this.apply() || this.snapshot !== snapshot || !this.active)
            return;
          this.word = this.selector!.next();
          this.wordDeadline = this.scheduler.now() + 8000;
        } else {
          this.visibilityDeadline = undefined;
          this.ready = true;
        }
        this.refresh();
      },
      Math.max(0, deadline - this.scheduler.now()),
    );
  }

  private clearTimer(): void {
    this.timerToken = undefined;
    this.timerDeadline = undefined;
    const cancel = this.cancelTimer;
    this.cancelTimer = undefined;
    cancel?.();
  }

  private suspend(): void {
    this.active = false;
    this.ready = false;
    this.visibilityDeadline = undefined;
    this.wordDeadline = undefined;
    this.clearTimer();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.suspend();
    this.update = undefined;
    this.word = undefined;
    this.snapshot = undefined;
  }
}
