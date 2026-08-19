## 2026-07-23 - API Error Leakage & CSS Injection Prevention

**Vulnerability:** API endpoints were returning raw error messages to the client on failure. `dangerouslySetInnerHTML` was used in `ChartStyle` without sanitizing color properties.
**Learning:** Catch blocks in API routes should default to returning generic errors (like "Internal server error") and log the real error internally to prevent leaking DB details or stack traces. CSS injection via React props can lead to XSS if not structural characters (`{}`, `;`, `<`, `>`) are stripped.
**Prevention:** Always log `e` internally and return generic messages. Use `.replace(/[;{}<>]/g, "")` on dynamic values injected into `<style>`.

## 2024-07-24 - Prevent JSON Payload DoS

**Vulnerability:** A length check on parsed JSON data does not prevent memory allocation DoS since `request.json()` will parse the entire enormous payload before the check can run.
**Learning:** To effectively prevent oversized payload DoS at the application layer when parsing body data, the incoming Content-Length must be verified before triggering the parser.
**Prevention:** Check `request.headers.get("content-length")` and fail early with a 413 Payload Too Large if the size exceeds expectations, before attempting to parse the body.
