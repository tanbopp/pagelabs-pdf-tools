# Security Policy

PageLabs processes user documents, so security and privacy are core features rather than
afterthoughts. We take all reports seriously.

## Supported versions

PageLabs is a continuously deployed web service. The hosted instance at
<https://pagelabs.tanbopp.cloud> always runs the latest `main`. Security fixes land on `main`
and are deployed immediately.

| Version | Supported |
| --- | --- |
| `main` (hosted + latest release) | ✅ |
| Older tagged releases | ❌ |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Instead, report privately using either:

1. **GitHub Security Advisories** — go to the
   [Security tab](https://github.com/tanbopp/pagelabs-pdf-tools/security/advisories/new)
   of the repository and click **"Report a vulnerability"**. This keeps the discussion private
   and lets us collaborate on a fix.
2. **Email** — send details to the maintainer at `security@tanbopp.cloud`.
   If you prefer, encrypt sensitive details or simply describe the issue and we will arrange a
   secure channel.

Please include:

- A description of the issue and its impact (data exposure, RCE, DoS, auth bypass, …)
- Steps to reproduce, or a proof-of-concept
- The affected URL/component and any relevant request/response snippets
- Whether you have already disclosed this elsewhere

### What to expect

| Stage | Target |
| --- | --- |
| Acknowledgement of your report | within 72 hours |
| Initial assessment and severity rating | within 7 days |
| Fix or mitigation for critical issues | as soon as practical |
| Public disclosure | coordinated with you, usually after a fix ships |

We will credit reporters in the advisory unless you ask us not to.

## Scope

In scope:

- The hosted application at `pagelabs.tanbopp.cloud`
- The browser processing engine (`apps/web/src/lib/local`) and the tool pages that call it
- Anything that causes a file to be sent over the network, persisted on a server, or logged
- Anything that breaks the "files never leave your device" or "no cookies / no trackers" promises
- Cross-site scripting or data exfiltration from a crafted document handled by a processor

Out of scope:

- Denial-of-service through intentionally huge or malformed files: processing happens on the
  reporter's own machine, so it cannot affect other users
- Findings that require a compromised device or browser extension
- Social engineering of maintainers
- Best-practice suggestions with no demonstrable impact (open a normal issue instead)

## Our security commitments

- No third-party analytics, trackers, or advertising cookies.
- Files are opened with the File API and processed in the browser. There is no upload endpoint,
  no object storage, no database and no queue.
- Results are `blob:` URLs scoped to the current tab; closing the tab discards them.
- Document parsing happens inside the browser sandbox (pdf.js, pdf-lib, WebAssembly), so a
  malicious document cannot compromise a shared server.
- The web app ships a strict Content Security Policy, `X-Frame-Options: DENY` and
  `X-Content-Type-Options: nosniff`.

See `PAGELABS_TECHNOLOGY.md` and `DESIGN.md` for background notes on how the browser pipeline
was chosen.

Thank you for helping keep PageLabs and its users safe.
