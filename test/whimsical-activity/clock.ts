import type { ActivityScheduler } from "../../extensions/whimsical-activity/activity-controller.ts";
import type { ActivityIndicatorPreferences } from "../../extensions/whimsical-activity/preferences.ts";

export const defaultPreferences: Readonly<ActivityIndicatorPreferences> =
  Object.freeze({
    enabled: true,
    text: "whimsical",
    animation: "asterisk",
    randomTiming: "once-per-run",
    color: "theme",
    motion: "normal",
    ascii: false,
    showElapsed: true,
    showAction: true,
    showOutputTokens: true,
  });

export interface ScheduledCallback {
  deadline: number;
  callback: () => void;
  active: boolean;
}

/** Controlled timeout delivery, including cancellation, queued stale delivery, and process suspension. */
export class FakeActivityClock implements ActivityScheduler {
  time = 0;
  readonly jobs: ScheduledCallback[] = [];
  now(): number {
    return this.time;
  }
  schedule(callback: () => void, delayMs: number): () => void {
    const job = { deadline: this.time + delayMs, callback, active: true };
    this.jobs.push(job);
    return () => {
      job.active = false;
    };
  }
  pending(): ScheduledCallback[] {
    return this.jobs
      .filter((job) => job.active)
      .sort((a, b) => a.deadline - b.deadline);
  }
  advance(ms: number): void {
    const target = this.time + ms;
    let job: ScheduledCallback | undefined;
    while ((job = this.pending()[0]) && job.deadline <= target) {
      this.time = job.deadline;
      job.active = false;
      job.callback();
    }
    this.time = target;
  }
  deliver(job: ScheduledCallback): void {
    job.active = false;
    job.callback();
  }
}

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}
