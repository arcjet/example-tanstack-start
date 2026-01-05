import { detectBot, fixedWindow } from "@arcjet/node";
import { createFileRoute } from "@tanstack/react-router";

import { arcjet, getArcjetRequest } from "~/lib/arcjet";

// Add rules to the base Arcjet instance
const aj = arcjet
  .withRule(
    detectBot({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
      // configured with a list of bots to allow from
      // https://arcjet.com/bot-list
      allow: [], // blocks all automated clients
    }),
  )
  // You can chain multiple rules, so we'll include a rate limit
  .withRule(
    fixedWindow({
      mode: "LIVE",
      max: 100,
      window: "60s",
    }),
  );

export const Route = createFileRoute("/bots/test")({
  server: {
    handlers: {
      GET: async () => {
        // The protect method returns a decision object that contains information
        // about the request.
        const decision = await aj.protect(getArcjetRequest());

        console.log("Arcjet decision: ", decision);

        // Use the IP analysis to customize the response based on the country
        if (decision.ip.hasCountry() && decision.ip.country === "JP") {
          return Response.json({ message: "Konnichiwa!" });
        }

        // Always deny requests from VPNs
        if (decision.ip.isVpn()) {
          return Response.json(
            { error: "VPNs are forbidden" },
            { status: 403 },
          );
        }

        // If the decision is denied, return an appropriate response. You can inspect
        // the decision results to customize the response.
        if (decision.isDenied() && decision.reason.isBot()) {
          return Response.json(
            { error: "Bots are forbidden" },
            { status: 403 },
          );
        } else if (decision.isDenied() && decision.reason.isRateLimit()) {
          return Response.json({ error: "Too many requests" }, { status: 429 });
        } else if (decision.isErrored()) {
          console.error("Arcjet error:", decision.reason);
          if (decision.reason.message === "[unauthenticated] invalid key") {
            return Response.json(
              {
                message:
                  "Invalid Arcjet key. Is the ARCJET_KEY environment variable set?",
              },
              { status: 500 },
            );
          } else {
            return Response.json(
              { message: `Internal server error: ${decision.reason.message}` },
              { status: 500 },
            );
          }
        }

        return Response.json({ message: "Hello world" });
      },
    },
  },
});
