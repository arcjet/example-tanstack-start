import { createFileRoute } from "@tanstack/react-router";
import { WhatNext } from "~/components/WhatNext";

export const Route = createFileRoute("/bots/")({
  component: RouteComponent,
});

const protocol = "http";
const hostname = "localhost:3000";

function RouteComponent() {
  return (
    <main className="page">
      <div className="section">
        <h1 className="heading-primary">Arcjet bot protection example</h1>
        <p className="typography-primary">
          This page is protected by{" "}
          <a
            href="https://docs.arcjet.com/bot-protection/concepts"
            className="link"
          >
            Arcjet&apos;s bot protection
          </a>{" "}
          configured to block automated clients.
        </p>
      </div>

      <hr className="divider" />

      <div className="section">
        <h2 className="heading-secondary">Try it</h2>
        <p className="typography-secondary">
          Make a request using <code>curl</code>, which is considered an
          automated client:
        </p>
        <pre className="codeblock">
          curl -v {protocol}://{hostname}/bots/test
        </pre>
        <p className="typography-secondary">
          Your IP will be blocked for 60 seconds.
        </p>
        <p className="typography-secondary">
          Bot protection can also be installed in middleware to protect your
          entire site.
        </p>
      </div>

      <hr className="divider" />

      <div className="section">
        <h2 className="heading-secondary">See the code</h2>
        <p className="typography-secondary">
          The{" "}
          <a
            href="https://github.com/arcjet/example-tanstack-start/blob/main/src/routes/bots/test.ts"
            target="_blank"
            rel="noreferrer"
            className="link"
          >
            server route
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
