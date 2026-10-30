import { FunctionsHttpError } from "@supabase/supabase-js"

// supabase-js reports every non-2xx edge function response as a generic
// "Edge Function returned a non-2xx status code"; the real message is in the
// response body.
export async function readFunctionError(
  error: unknown,
  fallback: string
): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body: unknown = await error.context.json()
      if (
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof body.error === "string"
      ) {
        return body.error
      }
    } catch {
      // Body wasn't JSON; fall through to the fallback message.
    }
  }
  return fallback
}
