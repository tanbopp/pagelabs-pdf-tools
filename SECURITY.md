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
- The API gateway (`apps/api`) and worker (`apps/worker`) code in this repository
- Upload handling, file storage, signed URLs, and the purge/retention logic
- Anything that breaks the "files are shredded after processing" or "no cookies / no trackers"
  promises

Out of scope:

- Denial-of-service through intentionally huge or malformed files on the public instance
  (report it anyway if it is cheap to trigger — we still want to know)
- Findings that require a compromised device or browser extension
- Social engineering of maintainers
- Best-practice suggestions with no demonstrable impact (open a normal issue instead)

## Our security commitments

- No third-party analytics, trackers, or advertising cookies.
- Uploaded files are stored ephemerally and purged on a schedule.
- Worker temp directories are removed after each job.
- Uploads are validated by magic bytes, not just the declared MIME type.

See `PAGELABS_TECHNOLOGY.md` and `DESIGN.md` for the full architecture and threat model notes.

Thank you for helping keep PageLabs and its users safe.
