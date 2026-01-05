import { env as processEnv } from "node:process";
import arcjetNode from "@arcjet/node";

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
  // of your routes that call `arcjet.protect()`. For this example,
  // we set specific rules in the route handlers instead.
  rules: [],
});

/**
 * The following is extracted from the TanStack Start framework in order to
 * gain access to the Node.js request object from within the Arcjet protect
 * calls.
 *
 * This is not officially supported by TanStack Start! It may break at any
 * time. Report any problems to Arcjet and _NOT_ to the TanStack
 * maintainers.
 *
 * See: https://github.com/TanStack/router/blob/a3e7d80b3faf4f2b5cf13b85a9bac23ce3eca90c/packages/start-server-core/src/request-response.ts
 */

const GLOBAL_EVENT_STORAGE_KEY = Symbol.for("tanstack-start:event-storage");

const globalObj = globalThis as typeof globalThis & {
  [GLOBAL_EVENT_STORAGE_KEY]?: import("node:async_hooks").AsyncLocalStorage<{
    h3Event: import("h3-v2").H3Event;
  }>;
};

function getH3Event() {
  const event = globalObj[GLOBAL_EVENT_STORAGE_KEY]?.getStore();
  if (!event) {
    throw new Error(
      `No StartEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`,
    );
  }
  return event.h3Event;
}

/**
 * Helper function to retrieve an `@arcjet/node` compatible request.
 *
 * It uses the above private API of TanStack Start to get access to
 * the Node.js request object. This can break at any time. Use at your
 * own risk. Report any issues to Arcjet and _NOT_ to the TanStack
 * maintainers.
 */
export function getArcjetRequest() {
  const event = getH3Event();

  if (!event.runtime?.node) {
    throw new Error("getArcjetRequest can only be used in a Node.js runtime");
  }

  return event.runtime.node.req;
}
