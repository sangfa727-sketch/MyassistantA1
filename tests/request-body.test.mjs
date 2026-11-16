import test from "node:test";
import assert from "node:assert/strict";
import { readBoundedJson } from "../lib/request-body.mjs";

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

test("parses a bounded JSON object", async () => {
  const request = new Request("https://a1.test/api", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ message: "မင်္ဂလာပါ" })
  });
  const result = await readBoundedJson(request, 1024);
  assert.deepEqual(result, { ok: true, value: { message: "မင်္ဂလာပါ" } });
});

test("accepts structured JSON media types", async () => {
  const request = new Request("https://a1.test/api", {
    method: "POST",
    headers: { "content-type": "application/problem+json" },
    body: JSON.stringify({ title: "bad request" })
  });
  const result = await readBoundedJson(request, 1024);
  assert.equal(result.ok, true);
});

test("rejects non-JSON content types", async () => {
  const request = new Request("https://a1.test/api", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: "{}"
  });
  const result = await readBoundedJson(request, 1024);
  assert.deepEqual(result, {
    ok: false,
    status: 415,
    error: "Content-Type must be application/json."
  });
});

test("rejects a declared oversized body before reading it", async () => {
  const request = new Request("https://a1.test/api", {
    method: "POST",
    headers: { ...jsonHeaders, "content-length": "2048" },
    body: "{}"
  });
  const result = await readBoundedJson(request, 1024);
  assert.equal(result.ok, false);
  assert.equal(result.status, 413);
});

test("rejects an oversized streamed body when Content-Length is absent", async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{"message":"'));
      controller.enqueue(new TextEncoder().encode("x".repeat(1100)));
      controller.enqueue(new TextEncoder().encode('"}'));
      controller.close();
    }
  });
  const request = new Request("https://a1.test/api", {
    method: "POST",
    headers: jsonHeaders,
    body: stream,
    duplex: "half"
  });
  const result = await readBoundedJson(request, 1024);
  assert.equal(result.ok, false);
  assert.equal(result.status, 413);
});

test("counts actual UTF-8 bytes rather than JavaScript characters", async () => {
  const request = new Request("https://a1.test/api", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify("က")
  });
  const result = await readBoundedJson(request, 5);
  assert.deepEqual(result, { ok: true, value: "က" });

  const tooSmall = new Request("https://a1.test/api", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify("က")
  });
  const rejected = await readBoundedJson(tooSmall, 4);
  assert.equal(rejected.ok, false);
  assert.equal(rejected.status, 413);
});

test("rejects malformed JSON and invalid UTF-8", async () => {
  const malformed = new Request("https://a1.test/api", {
    method: "POST",
    headers: jsonHeaders,
    body: "{"
  });
  assert.equal((await readBoundedJson(malformed, 1024)).status, 400);

  const invalidUtf8 = new Request("https://a1.test/api", {
    method: "POST",
    headers: jsonHeaders,
    body: new Uint8Array([0xff])
  });
  assert.equal((await readBoundedJson(invalidUtf8, 1024)).status, 400);
});

test("rejects missing bodies and invalid limits", async () => {
  const request = new Request("https://a1.test/api", {
    method: "POST",
    headers: jsonHeaders
  });
  assert.equal((await readBoundedJson(request, 1024)).status, 400);
  await assert.rejects(() => readBoundedJson(request, 0), /maxBytes/);
});
