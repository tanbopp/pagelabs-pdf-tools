import test from "node:test";
import assert from "node:assert";
import { TOOL_REGISTRY, mergePdfOptionsSchema } from "@pagelabs/shared";

test("Tool registry contains all tools and merge-pdf is available", () => {
  assert.strictEqual(TOOL_REGISTRY["merge-pdf"]?.available, true);
  assert.strictEqual(TOOL_REGISTRY["split-pdf"]?.available, true);
  assert.strictEqual(TOOL_REGISTRY["compress-pdf"]?.available, true);
  assert.strictEqual(TOOL_REGISTRY["protect-pdf"]?.available, true);
});

test("Merge PDF options schema validates correctly", () => {
  const valid = mergePdfOptionsSchema.safeParse({
    outputFilename: "result.pdf",
    addBookmarks: true,
  });
  assert.strictEqual(valid.success, true);

  const invalidExt = mergePdfOptionsSchema.safeParse({
    outputFilename: "result.txt",
  });
  assert.strictEqual(invalidExt.success, false);

  const invalidChars = mergePdfOptionsSchema.safeParse({
    outputFilename: "../result.pdf",
  });
  assert.strictEqual(invalidChars.success, false);
});
