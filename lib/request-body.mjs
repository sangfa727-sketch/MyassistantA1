const JSON_MEDIA_TYPE = /^application\/(?:json|[a-z0-9!#$&^_.+-]+\+json)$/i;

function failure(status, error) {
  return { ok: false, status, error };
}

export async function readBoundedJson(request, maxBytes) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new RangeError("maxBytes must be a positive safe integer.");
  }

  const contentType = request.headers.get("content-type") || "";
  const mediaType = contentType.split(";", 1)[0].trim();
  if (!JSON_MEDIA_TYPE.test(mediaType)) {
    return failure(415, "Content-Type must be application/json.");
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) {
      return failure(400, "Invalid Content-Length header.");
    }
    if (Number(contentLength) > maxBytes) {
      return failure(413, "Request body is too large.");
    }
  }

  if (!request.body) {
    return failure(400, "A JSON request body is required.");
  }

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) {
        return failure(400, "Request body must be a byte stream.");
      }

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        try {
          await reader.cancel();
        } catch {}
        return failure(413, "Request body is too large.");
      }
      chunks.push(value);
    }
  } catch {
    return failure(400, "Request body could not be read.");
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let decoded;
  try {
    decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return failure(400, "Request body must be valid UTF-8.");
  }

  try {
    return { ok: true, value: JSON.parse(decoded) };
  } catch {
    return failure(400, "Request body must contain valid JSON.");
  }
}
