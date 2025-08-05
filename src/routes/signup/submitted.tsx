import { createFileRoute } from "@tanstack/react-router";
import { WhatNext } from "~/components/WhatNext";

export const Route = createFileRoute("/signup/submitted")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="page">
      <section className="section">
        <h1 className="heading-primary">Form submitted</h1>
        <p className="typography-primary">
          If this were a real form, your message would have been submitted.
        </p>
      </section>
      <hr className="divider" />
      <WhatNext />
    </main>
  );
}
