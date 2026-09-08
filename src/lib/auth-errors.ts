import { EMAIL_FORMAT_ERROR } from "@/lib/utils";

/**
 * Map a NextAuth `signIn` failure onto a message the user can act on.
 *
 * `authorize` throws sentinel codes rather than prose so every sign-in surface
 * words them the same way. Anything unrecognised stays deliberately vague —
 * "no such account" and "wrong password" must not be distinguishable.
 */
export function signInErrorMessage(code: string): string {
  switch (code) {
    case "INVALID_EMAIL_FORMAT":
      return EMAIL_FORMAT_ERROR;
    case "EMAIL_NOT_VERIFIED":
      return "Please verify your email. We sent a fresh verification link.";
    case "MISSING_CREDENTIALS":
      return "Please enter both your email and password.";
    default:
      return code.includes("disabled")
        ? code
        : "Invalid email or password. Please try again.";
  }
}
