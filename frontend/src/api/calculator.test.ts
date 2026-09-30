import { afterEach, describe, expect, it, vi } from "vitest";
import { calculate } from "./calculator";

/** Replaces fetch with one that answers with the given status and body. */
function respondWith(status: number, body: string) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("calculate", () => {
  it("posts both operands and returns the result", async () => {
    const fetchMock = respondWith(200, '{"result":8}');

    await expect(calculate("add", 5, 3)).resolves.toBe(8);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/add",
      expect.objectContaining({ method: "POST", body: '{"a":5,"b":3}' }),
    );
  });

  it("leaves b out for a square root", async () => {
    const fetchMock = respondWith(200, '{"result":3}');

    await calculate("sqrt", 9);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/sqrt",
      expect.objectContaining({ body: '{"a":9}' }),
    );
  });

  it("rejects with the backend's error message", async () => {
    respondWith(400, '{"error":"division by zero is not allowed"}');

    await expect(calculate("divide", 5, 0)).rejects.toThrow("division by zero is not allowed");
  });

  it("rejects with the status when the error body is not JSON", async () => {
    respondWith(404, "404 page not found");

    await expect(calculate("add", 1, 2)).rejects.toThrow("request failed (404)");
  });

  it("rejects when the server can't be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(calculate("add", 1, 2)).rejects.toThrow("can't reach the server");
  });

  it("rejects a success response without a numeric result", async () => {
    respondWith(200, "{}");

    await expect(calculate("add", 1, 2)).rejects.toThrow("unexpected response from the server");
  });
});
