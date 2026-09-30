/** Name of a calculator endpoint in the backend API (POST /{operation}). */
export type Operation =
  | "add"
  | "subtract"
  | "multiply"
  | "divide"
  | "pow"
  | "sqrt"
  | "percent";

/** Operations that need two operands. */
export type BinaryOperation = Exclude<Operation, "sqrt">;

/** Backend base URL, set in frontend/.env. Falls back to the local Go server. */
const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

/** Body the backend sends back: a result on success, an error otherwise. */
interface ApiResponse {
  result?: number;
  error?: string;
}

/**
 * Asks the backend to apply operation to a and b, and resolves with the result.
 * For "sqrt" only a is used, so b can be left out.
 *
 * Rejects with an Error whose message can be shown to the user.
 */
export async function calculate(operation: Operation, a: number, b?: number): Promise<number> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/${operation}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a, b }), // JSON.stringify leaves b out when it is undefined
    });
  } catch {
    // fetch only rejects when no response arrives: server down, CORS blocked, no network.
    throw new Error("can't reach the server");
  }

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data?.error ?? `request failed (${response.status})`);
  }

  if (typeof data?.result !== "number") {
    throw new Error("unexpected response from the server");
  }

  return data.result;
}

/** Parses the body as JSON, or returns null if it isn't JSON (like the plain-text 404 and 405). */
async function readJson(response: Response): Promise<ApiResponse | null> {
  try {
    return (await response.json()) as ApiResponse;
  } catch {
    return null;
  }
}
