import { describe, expect, it } from "vitest";
import { RecordingLogger } from "../fakes/recording-logger.js";

describe("RecordingLogger", () => {
  it("records each level with its message and structured context", () => {
    const logger = new RecordingLogger();
    logger.info("core connected", { coreId: "core-1" });
    logger.error("deploy failed", { reason: "timeout" });

    expect(logger.entries).toEqual([
      { level: "info", message: "core connected", context: { coreId: "core-1" } },
      { level: "error", message: "deploy failed", context: { reason: "timeout" } },
    ]);
  });

  it("allows omitting context", () => {
    const logger = new RecordingLogger();
    logger.debug("tick");
    expect(logger.entries[0]).toEqual({
      level: "debug",
      message: "tick",
      context: undefined,
    });
  });
});
