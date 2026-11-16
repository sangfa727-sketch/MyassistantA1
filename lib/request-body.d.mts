export type BoundedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413 | 415; error: string };

export function readBoundedJson(
  request: Request,
  maxBytes: number
): Promise<BoundedJsonResult>;
