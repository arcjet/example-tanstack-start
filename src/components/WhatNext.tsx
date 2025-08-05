export function WhatNext() {
  return (
    <div className="section">
      <h2 className="heading-secondary">What next?</h2>
      <div className="list-actions">
        <a
          href="https://app.arcjet.com"
          target="_blank"
          rel="noopener noreferrer"
          className="button-secondary"
        >
          Sign up for Arcjet
        </a>
      </div>
      <div className="list-actions">
        <p className="typography-secondary">Want to know more? </p>
        <div>
          <a
            href="https://docs.arcjet.com"
            target="_blank"
            rel="noopener noreferrer"
            className="link"
          >
            Arcjet docs
          </a>
          <span className="typography-secondary">{" / "}</span>
          <a
            href="https://arcjet.com/discord"
            target="_blank"
            rel="noreferrer"
            className="link"
          >
            Join our Discord
          </a>
        </div>
      </div>
    </div>
  );
}
