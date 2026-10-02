import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import whimsicalActivity from "../../extensions/whimsical-activity/index.ts";
import type {
  ActivityDecorationController,
  ActivityDecorationUI,
} from "../../extensions/whimsical-activity/activity-controller.ts";
import type {
  ActivityDecorationOverrides,
  ActivityIndicatorPreferences,
} from "../../extensions/whimsical-activity/preferences.ts";
import { ActivityWordSelector } from "../../extensions/whimsical-activity/word-bank.ts";
import {
  defaultPreferences,
  FakeActivityClock,
  seededRandom,
} from "./clock.ts";

function fixture(
  options: {
    supported?: boolean;
    declined?: boolean;
    invalidBank?: boolean;
    saved?: Partial<ActivityIndicatorPreferences>;
  } = {},
) {
  const flags = new Map<string, boolean | string | undefined>();
  const definitions = new Map<
    string,
    { type: "boolean" | "string"; default?: boolean | string }
  >();
  const handlers = new Map<
    string,
    (event: unknown, ctx: ExtensionContext) => unknown
  >();
  const notifications: string[] = [];
  const controllers: ActivityDecorationController[] = [];
  const presentations: {
    label?: string;
    reservedWidth?: number;
    nativeTextFallback?: true;
    glyph: string;
  }[] = [];
  const invocationOverrides: ActivityDecorationOverrides[] = [];
  const clock = new FakeActivityClock();
  let banks = 0;
  let registrations = 0;
  let removals = 0;
  // SAFETY: Only the real entry's on/registerFlag/getFlag port is exercised; event callbacks are stored, not reimplemented.
  const api = {
    registerFlag(
      name: string,
      definition: { type: "boolean" | "string"; default?: boolean | string },
    ) {
      definitions.set(name, definition);
      flags.set(name, definition.default);
    },
    getFlag: (name: string) => flags.get(name),
    on(
      event: string,
      handler: (event: unknown, ctx: ExtensionContext) => unknown,
    ) {
      handlers.set(event, handler);
      return () => handlers.delete(event);
    },
  } as unknown as ExtensionAPI;
  whimsicalActivity(
    api,
    () => {
      banks++;
      return options.invalidBank
        ? new ActivityWordSelector(seededRandom(31), () => "invalid JSON")
        : new ActivityWordSelector(seededRandom(31));
    },
    clock,
  );
  const ui: {
    notify: (message: string) => void;
  } & Partial<ActivityDecorationUI> = {
    notify: (message) => notifications.push(message),
  };
  if (options.supported !== false)
    ui.registerActivityDecoration = (factory, overrides = {}) => {
      registrations++;
      invocationOverrides.push(overrides);
      if (options.declined) return undefined;
      // The local seam verifies override forwarding; actual dormant host behavior is owned by native source tests.
      const controller = overrides.enabled === false ? undefined : factory();
      if (controller) controllers.push(controller);
      let removed = false;
      return () => {
        if (removed) return;
        removed = true;
        removals++;
        controller?.dispose();
      };
    };
  // SAFETY: The entry reads only mode/hasUI/ui; no session, prompt or execution behavior is mocked.
  const ctx = { mode: "tui", hasUI: true, ui } as unknown as ExtensionContext;
  const start = () =>
    handlers.get("session_start")!(
      { type: "session_start", reason: "startup" },
      ctx,
    );
  const shutdown = () =>
    handlers.get("session_shutdown")!(
      { type: "session_shutdown", reason: "reload" },
      ctx,
    );
  const busy = () =>
    controllers.at(-1)!.onSnapshot(
      {
        runId: Symbol("run"),
        ownerGeneration: 1,
        kind: "working",
        genericWorking: true,
        eligible: true,
        visible: true,
        waiting: false,
        preferences: Object.freeze({
          ...defaultPreferences,
          ...options.saved,
          ...invocationOverrides.at(-1),
        }),
      },
      (value) => {
        presentations.push(value);
        return true;
      },
    );
  return {
    definitions,
    flags,
    notifications,
    controllers,
    clock,
    ctx,
    start,
    shutdown,
    busy,
    presentations,
    invocationOverrides,
    banks: () => banks,
    registrations: () => registrations,
    removals: () => removals,
  };
}

function tty(input = true, output = true): () => void {
  const previousInput = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");
  const previousOutput = Object.getOwnPropertyDescriptor(
    process.stdout,
    "isTTY",
  );
  Object.defineProperty(process.stdin, "isTTY", {
    value: input,
    configurable: true,
  });
  Object.defineProperty(process.stdout, "isTTY", {
    value: output,
    configurable: true,
  });
  return () => {
    if (previousInput)
      Object.defineProperty(process.stdin, "isTTY", previousInput);
    else Reflect.deleteProperty(process.stdin, "isTTY");
    if (previousOutput)
      Object.defineProperty(process.stdout, "isTTY", previousOutput);
    else Reflect.deleteProperty(process.stdout, "isTTY");
  };
}

test("entry registers exactly the three explicit controls; valid factory is lazy and bag survives session starts", () => {
  const restore = tty();
  try {
    const f = fixture();
    assert.deepEqual(
      [...f.definitions.keys()],
      ["no-whimsical-activity", "activity-display", "activity-ascii"],
    );
    assert.equal(f.flags.get("activity-display"), undefined);
    assert.ok(
      [...f.definitions.values()].every(
        (definition) => !("default" in definition),
      ),
    );
    assert.deepEqual([...f.controllers], []);
    assert.equal(f.banks(), 0);
    f.start();
    assert.equal(f.controllers.length, 1);
    assert.deepEqual(f.invocationOverrides, [{}]);
    assert.equal(f.banks(), 0);
    f.busy();
    f.clock.advance(250);
    const first = f.presentations.at(-1)?.label;
    assert.equal(f.banks(), 1);
    f.start();
    assert.equal(f.removals(), 1);
    assert.equal(f.clock.pending().length, 0);
    f.busy();
    f.clock.advance(250);
    assert.equal(f.banks(), 1);
    assert.notEqual(f.presentations.at(-1)?.label, first);
    const reference = new ActivityWordSelector(seededRandom(31));
    assert.equal(first, reference.next() + "…");
    assert.equal(f.presentations.at(-1)?.label, reference.next() + "…");
    f.shutdown();
    f.shutdown();
    assert.equal(f.removals(), 2);
    assert.equal(f.clock.pending().length, 0);
  } finally {
    restore();
  }
});

for (const mode of ["print", "json", "rpc"] as const) {
  test(`AT21: ${mode} with hasUI true never registers, constructs a bank/controller, or diagnoses`, () => {
    const restore = tty();
    try {
      const f = fixture({ supported: false });
      f.ctx.mode = mode;
      f.start();
      assert.equal(f.registrations(), 0);
      assert.equal(f.controllers.length, 0);
      assert.equal(f.banks(), 0);
      assert.equal(f.clock.pending().length, 0);
      assert.deepEqual(f.notifications, []);
    } finally {
      restore();
    }
  });
}

for (const [input, output] of [
  [false, true],
  [true, false],
  [false, false],
]) {
  test(`AT21: TUI with stdin TTY=${input}/stdout TTY=${output} stays untouched`, () => {
    const restore = tty(input, output);
    try {
      const f = fixture();
      f.start();
      assert.equal(f.registrations(), 0);
      assert.equal(f.banks(), 0);
      assert.equal(f.controllers.length, 0);
      assert.equal(f.clock.pending().length, 0);
      assert.deepEqual(f.notifications, []);
    } finally {
      restore();
    }
  });
}

test("AT21–AT22: disabled/hasUI false and declined native composition do not construct the bank", () => {
  const restore = tty();
  try {
    const disabled = fixture();
    disabled.flags.set("no-whimsical-activity", true);
    disabled.start();
    assert.equal(disabled.registrations(), 1);
    assert.deepEqual(disabled.invocationOverrides, [{ enabled: false }]);
    assert.equal(disabled.controllers.length, 0);
    assert.equal(disabled.clock.pending().length, 0);
    disabled.flags.set("no-whimsical-activity", false);
    disabled.ctx.hasUI = false;
    disabled.start();
    assert.equal(disabled.registrations(), 1);
    assert.equal(disabled.removals(), 1);
    assert.equal(disabled.banks(), 0);
    const declined = fixture({ declined: true });
    declined.start();
    assert.equal(declined.registrations(), 1);
    assert.equal(declined.controllers.length, 0);
    assert.equal(declined.banks(), 0);
    assert.equal(declined.clock.pending().length, 0);
    assert.deepEqual(declined.notifications, []); // Host owns competition/custom-renderer diagnostics.
  } finally {
    restore();
  }
});

test("AT22: unsupported eligible hosts diagnose once with no fallback editor or controller", () => {
  const restore = tty();
  try {
    const f = fixture({ supported: false });
    f.start();
    f.start();
    f.shutdown();
    assert.equal(f.notifications.length, 1);
    assert.match(f.notifications[0], /registerActivityDecoration/);
    assert.equal(f.controllers.length, 0);
    assert.equal(f.banks(), 0);
    assert.equal(f.clock.pending().length, 0);
  } finally {
    restore();
  }
});

test("invalid display values disable decoration with one existing-path warning", () => {
  const restore = tty();
  try {
    const f = fixture();
    f.flags.set("activity-display", "invalid");
    f.start();
    f.start();
    assert.equal(f.notifications.length, 1);
    assert.match(f.notifications[0], /expected normal, reduced, or plain/);
    assert.equal(f.registrations(), 0);
    assert.equal(f.banks(), 0);
  } finally {
    restore();
  }
});

for (const display of ["normal", "reduced", "plain"] as const) {
  test(`entry composes ${display}/ASCII preferences without custom UI or execution controls`, () => {
    const restore = tty();
    try {
      const f = fixture();
      f.flags.set("activity-display", display);
      f.flags.set("activity-ascii", true);
      f.start();
      f.busy();
      f.clock.advance(250);
      assert.equal(
        f.presentations.at(-1)?.glyph,
        display === "normal"
          ? "animated"
          : display === "reduced"
            ? "static"
            : "hidden",
      );
      if (display === "plain") {
        assert.equal(f.banks(), 0);
        assert.equal(f.presentations.at(-1)?.label, undefined);
      } else {
        assert.ok(f.presentations.at(-1)?.label?.endsWith("..."));
        assert.equal(f.presentations.at(-1)?.reservedWidth, 16);
      }
      assert.equal(f.clock.pending().length, display === "normal" ? 1 : 0);
      f.shutdown();
      assert.equal(f.clock.pending().length, 0);
    } finally {
      restore();
    }
  });
}

test("invalid-bank diagnostic is consumed once across rotation, revocation and session start", () => {
  const restore = tty();
  try {
    const f = fixture({ invalidBank: true });
    f.start();
    f.busy();
    f.clock.advance(250);
    assert.deepEqual(f.presentations.at(-1), {
      glyph: "animated",
      nativeTextFallback: true,
    });
    assert.equal(f.clock.pending().length, 0);
    f.clock.advance(16000);
    f.start();
    f.busy();
    f.clock.advance(250);
    assert.equal(f.banks(), 1);
    assert.equal(f.notifications.length, 1);
    f.shutdown();
  } finally {
    restore();
  }
});

for (const saved of [
  { motion: "reduced" as const, ascii: true },
  { text: "operational" as const },
  { motion: "plain" as const },
  { enabled: false },
]) {
  test(`AM04: absent flags inherit saved ${JSON.stringify(saved)} rather than registered defaults`, () => {
    const restore = tty();
    try {
      const f = fixture({ saved });
      // Actual boolean flag readers may return false for absence; false must not override saved ASCII/enabled.
      f.flags.set("activity-ascii", false);
      f.flags.set("no-whimsical-activity", false);
      f.start();
      assert.deepEqual(f.invocationOverrides, [{}]);
      f.busy();
      f.clock.advance(250);
      assert.equal(f.clock.pending().length, 0);
      if ("ascii" in saved) {
        assert.ok(f.presentations.at(-1)?.label?.endsWith("..."));
        assert.equal(f.presentations.at(-1)?.glyph, "static");
        assert.equal(f.banks(), 1);
      } else {
        assert.equal(f.banks(), 0);
        assert.equal(f.presentations.at(-1)?.label, undefined);
      }
      f.shutdown();
    } finally {
      restore();
    }
  });
}

test("AM04: explicit invocation controls override only supplied fields, without rewriting saved preferences", () => {
  const restore = tty();
  try {
    const saved = Object.freeze({
      motion: "reduced" as const,
      ascii: false,
      animation: "random" as const,
      color: "claude" as const,
    });
    const f = fixture({ saved });
    f.flags.set("activity-display", "normal");
    f.flags.set("activity-ascii", true);
    f.start();
    assert.deepEqual(f.invocationOverrides, [
      { motion: "normal", ascii: true },
    ]);
    f.busy();
    f.clock.advance(250);
    assert.equal(f.presentations.at(-1)?.glyph, "animated");
    assert.ok(f.presentations.at(-1)?.label?.endsWith("..."));
    assert.deepEqual(saved, {
      motion: "reduced",
      ascii: false,
      animation: "random",
      color: "claude",
    });
    f.shutdown();
  } finally {
    restore();
  }
});

for (const supported of [true, false]) {
  test(`AM04/AM09: hard disable ignores invalid display, stays silent, and forwards only a dormant override (supported=${supported})`, () => {
    const restore = tty();
    try {
      const f = fixture({ supported });
      f.flags.set("no-whimsical-activity", true);
      f.flags.set("activity-display", "invalid");
      f.flags.set("activity-ascii", true);
      f.start();
      f.start();
      f.shutdown();
      f.shutdown();
      assert.equal(f.registrations(), supported ? 2 : 0);
      assert.deepEqual(
        f.invocationOverrides,
        supported ? [{ enabled: false }, { enabled: false }] : [],
      );
      assert.equal(f.removals(), supported ? 2 : 0);
      assert.equal(f.controllers.length, 0);
      assert.equal(f.banks(), 0);
      assert.equal(f.clock.pending().length, 0);
      assert.deepEqual(f.notifications, []);
    } finally {
      restore();
    }
  });
}
