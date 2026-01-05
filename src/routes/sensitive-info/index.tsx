import { sensitiveInfo, shield } from "@arcjet/node";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { WhatNext } from "~/components/WhatNext";
import { arcjet, getArcjetRequest } from "~/lib/arcjet";

// Add rules to the base Arcjet instance
const aj = arcjet
  .withRule(
    // Arcjet's protectSignup rule is a combination of email validation, bot
    // protection and rate limiting. Each of these can also be used separately
    // on other routes e.g. rate limiting on a login route. See
    // https://docs.arcjet.com/get-started
    sensitiveInfo({
      mode: "LIVE", // Will block requests, use "DRY_RUN" to log only
      deny: ["CREDIT_CARD_NUMBER", "EMAIL"], // Deny requests with credit card numbers
    }),
  )
  // You can chain multiple rules, so we'll include shield
  .withRule(
    // Shield detects suspicious behavior, such as SQL injection and cross-site
    // scripting attacks.
    shield({
      mode: "LIVE",
    }),
  );

// Zod for client-side validation of the form fields. Arcjet will do
// server-side validation as well because you can't trust the client.
// Client-side validation improves the UX by providing immediate feedback
// whereas server-side validation is necessary for security.
export const FormSchema = z.object({
  supportMessage: z.coerce
    .string()
    .min(5, { message: "Your message must be at least 5 characters." })
    .max(1000, {
      message:
        "Your message is too long. Please shorten it to 1000 characters.",
    }),
});

// TODO: Sensitive info detection is silently failing (likely due to not being able to read the request body)
// TODO: There is a bug where when setResponseStatus(XXX); is called the response on the client doesn't match the expected type...

export const sensitiveInfoServerFunction = createServerFn({ method: "POST" })
  .inputValidator((data) => {
    if (!(data instanceof FormData)) {
      throw new Error("Expected FormData");
    }
    return FormSchema.parse(Object.fromEntries(data.entries()));
  })
  .handler(async (ctx) => {
    // The protect method returns a decision object that contains information
    // about the request.
    const decision = await aj.protect(getArcjetRequest());

    console.log("Arcjet decision: ", decision);

    if (decision.isDenied()) {
      if (decision.reason.isSensitiveInfo()) {
        // setResponseStatus(400);
        return "We couldn't submit the form: please do not include credit card numbers in your message.";
      } else {
        // setResponseStatus(403);
        return "Forbidden";
      }
    } else if (decision.isErrored()) {
      console.error("Arcjet error:", decision.reason);

      if (decision.reason.message === "[unauthenticated] invalid key") {
        // setResponseStatus(500);
        return "Invalid Arcjet key. Is the ARCJET_KEY environment variable set?";
      } else {
        // setResponseStatus(400);
        return `Internal server error: ${decision.reason.message}`;
      }
    }

    console.log("Message submitted successfully:", ctx.data.supportMessage);

    throw redirect({ to: "/sensitive-info/submitted" });
  });

export const Route = createFileRoute("/sensitive-info/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = useServerFn(sensitiveInfoServerFunction);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const errorMessage = await submit({ data: formData });
    setErrorMessage(errorMessage);
  };

  return (
    <main className="page">
      <div className="section">
        <h1 className="heading-primary">
          Arcjet sensitive info detection example
        </h1>
        <p className="typography-primary">
          This form uses{" "}
          <a
            href="https://docs.arcjet.com/sensitive-info/concepts"
            className="link"
          >
            Arcjet&apos;s sensitive info detection
          </a>{" "}
          feature which is configured to detect credit card numbers. It can be
          configured to detect other types of sensitive information and custom
          patterns.
        </p>
        <p className="typography-secondary">
          The request is analyzed entirely on your server so no sensitive
          information is sent to Arcjet.
        </p>
      </div>

      <hr className="divider" />

      <div className="section">
        <h2 className="heading-secondary">Try it</h2>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">
              Message
              <textarea
                placeholder="Please enter your message."
                className="form-textarea"
                name="supportMessage"
                defaultValue="I ordered a hat from your store and would like to request a refund. My credit card number is 4111111111111111"
              />
            </label>
            {errorMessage && <div className="form-error">{errorMessage}</div>}
          </div>
          <button type="submit" className="button-primary form-button">
            Submit
          </button>
        </form>
      </div>
      <hr className="divider" />
      <div className="section">
        <h2 className="heading-secondary">See the code</h2>
        <p className="typography-secondary">
          The{" "}
          <a
            href="https://github.com/arcjet/example-tanstack-start/blob/main/src/routes/sensitive-info/index.tsx"
            target="_blank"
            rel="noreferrer"
            className="link"
          >
            server function
          </a>{" "}
          extends the{" "}
          <a
            href="https://github.com/arcjet/example-tanstack-start/blob/main/src/lib/arcjet.ts"
            target="_blank"
            rel="noreferrer"
            className="link"
          >
            centralized Arcjet client
          </a>
          .
        </p>
      </div>
      <hr className="divider" />
      <WhatNext />
    </main>
  );
}
