import test from "node:test";
import assert from "node:assert";
import { TOOL_REGISTRY, mergePdfOptionsSchema } from "@pagelabs/shared";

test("Tool registry contains all tools and only merge-pdf is available", () => {
  assert.strictEqual(TOOL_REGISTRY["merge-pdf"]?.available, true);
  assert.strictEqual(TOOL_REGISTRY["split-pdf"]?.available, false);
  assert.strictEqual(TOOL_REGISTRY["compress-pdf"]?.available, false);
  assert.strictEqual(TOOL_REGISTRY["protect-pdf"]?.available, false);
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
