import { protectSignup, shield } from "@arcjet/node";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { WhatNext } from "~/components/WhatNext";
import { arcjet, getArcjetRequest } from "~/lib/arcjet";

// Add rules to the base Arcjet client
const aj = arcjet
  .withRule(
    // Arcjet's protectSignup rule is a combination of email validation, bot
    // protection and rate limiting. Each of these can also be used separately
    // on other routes e.g. rate limiting on a login route. See
    // https://docs.arcjet.com/get-started
    protectSignup({
      email: {
        mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
        // Block emails that are disposable, invalid, or have no MX records
        block: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
      },
      bots: {
        mode: "LIVE",
        // configured with a list of bots to allow from
        // https://arcjet.com/bot-list
        allow: [], // prevents bots from submitting the form
      },
      // It would be unusual for a form to be submitted more than 5 times in 10
      // minutes from the same IP address
      rateLimit: {
        // uses a sliding window rate limit
        mode: "LIVE",
        interval: "2m", // counts requests over a 10 minute sliding window
        max: 5, // allows 5 submissions within the window
      },
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
  email: z.email({
    message: "Please enter a valid email address.",
  }),
});

// TODO: There is a bug where when setResponseStatus(XXX); is called the response on the client doesn't match the expected type...

export const signupServerFunction = createServerFn()
  .validator((data) => {
    if (!(data instanceof FormData)) {
      throw new Error("Expected FormData");
    }
    return FormSchema.parse(Object.fromEntries(data.entries()));
  })
  .handler(async (ctx) => {
    // The protect method returns a decision object that contains information
    // about the request.
    const decision = await aj.protect(getArcjetRequest(), {
      email: ctx.data.email,
    });

    console.log("Arcjet decision: ", decision);

    if (decision.isDenied()) {
      if (decision.reason.isEmail()) {
        let message: string;

        // These are specific errors to help the user, but will also reveal the
        // validation to a spammer.
        if (decision.reason.emailTypes.includes("INVALID")) {
          message = "email address format is invalid. Is there a typo?";
        } else if (decision.reason.emailTypes.includes("DISPOSABLE")) {
          message = "we do not allow disposable email addresses.";
        } else if (decision.reason.emailTypes.includes("NO_MX_RECORDS")) {
          message =
            "your email domain does not have an MX record. Is there a typo?";
        } else {
          // This is a catch all, but the above should be exhaustive based on the
          // configured rules.
          message = "invalid email.";
        }

        if (decision.ip.hasCountry()) {
          message += ` PS: Hello to you in ${decision.ip.countryName}!`;
        }

        // setResponseStatus(400);
        return message;
      } else if (decision.reason.isRateLimit()) {
        const reset = decision.reason.resetTime;

        if (reset === undefined) {
          // setResponseStatus(429);
          return "too many requests. Please try again later.";
        }

        // Calculate number of seconds between reset Date and now
        const seconds = Math.floor((reset.getTime() - Date.now()) / 1000);
        const minutes = Math.ceil(seconds / 60);

        if (minutes > 1) {
          // setResponseStatus(429);
          return `too many requests. Please try again in ${minutes} minutes.`;
        } else {
          // setResponseStatus(429);
          return `too many requests. Please try again in ${seconds} seconds.`;
        }
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

    throw redirect({ to: "/signup/submitted" });
  });

export const Route = createFileRoute("/signup/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = useServerFn(signupServerFunction);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const errorMessage = await submit({ data: formData });
    setErrorMessage(errorMessage);
  };

  return (
    <main className="page">
      <div className="section">
        <h1 className="heading-primary">Arcjet signup form protection</h1>
        <p className="typography-primary">
          This form uses{" "}
          <a
            href="https://docs.arcjet.com/signup-protection/concepts"
            className="link"
          >
            Arcjet&apos;s signup form protection
          </a>{" "}
          which includes:
        </p>
        <ul className="bulleted--primary">
          <li>
            Arcjet server-side email verification configured to block disposable
            providers and ensure that the domain has a valid MX record.
          </li>
          <li>
            Rate limiting set to 5 requests over a 2 minute sliding window - a
            reasonable limit for a signup form, but easily configurable.
          </li>
          <li>
            Bot protection to stop automated clients from submitting the form.
          </li>
        </ul>
      </div>
      <hr className="divider" />
      <div className="section">
        <h2 className="heading-secondary">Try it</h2>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">
              Email
              <input
                name="email"
                type="email"
                placeholder="totoro@example.com"
                className="form-input"
                defaultValue="nonexistent@arcjet.ai"
              />
            </label>
            <span className="form-description">
              Just a test form - you won&apos;t receive any emails.
            </span>
            {errorMessage && <div className="form-error">{errorMessage}</div>}
          </div>
          <div className="form-button">
            <button type="submit" className="button-primary">
              {" "}
              Sign up{" "}
            </button>
          </div>
        </form>
        <h2 className="heading-secondary">Test emails</h2>
        <p className="typography-secondary">
          Try these emails to see how it works:
        </p>
        <ul className="list-bullets-secondary">
          <li>
            <code>invalid.@arcjet</code> – is an invalid email address.
          </li>
          <li>
            <code>test@0zc7eznv3rsiswlohu.tk</code>{" "}
            <span>– is from a disposable email provider.</span>
          </li>
          <li>
            <code>nonexistent@arcjet.ai</code> – is a valid email address &
            domain, but has no MX records.
          </li>
        </ul>
      </div>
      <hr className="divider" />
      <div className="section">
        <h2 className="heading-secondary">See the code</h2>
        <p className="typography-secondary">
          The{" "}
          <a
            href="https://github.com/arcjet/example-tanstack-start/blob/main/src/routes/signup/index.tsx"
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
