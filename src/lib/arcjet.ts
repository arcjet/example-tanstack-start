import { env as processEnv } from "node:process";
import arcjetNode from "@arcjet/node";
import { getEvent } from "@tanstack/react-start/server";

let arcjetKey = processEnv.ARCJET_KEY;
if (!arcjetKey) {
  console.warn(
    "ARCJET_KEY environment variable is required. Sign up for your Arcjet key at https://app.arcjet.com",
  );
  // Typically you would throw an error here, but for the sake of this example,
  // we will just set an empty key and Arcjet will show errors about the
  // missing key.
  arcjetKey = "";
}

export const arcjet = arcjetNode({
  key: arcjetKey,
  // Here is where you could configure rules that would be applied to all
  // of your routes that call `fastify.arcjet.protect()`. For this example,
  // we set specific rules in the route handlers instead.
  rules: [],
});

/**
 * Helper function to retrieve an `@arcjet/node` compatible request.
 *
 * It uses `@tanstack/react-start/server`'s {@link getEvent} function to
 * retrieve the original node req as
 * {@link https://v1.h3.dev/guide/event#eventnode | documented in h3}.
 */
export function getArcjetRequest() {
  return getEvent().node.req;
}
