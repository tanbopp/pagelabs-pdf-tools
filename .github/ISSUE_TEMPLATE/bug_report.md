name: Bug report
description: Something is broken or behaves unexpectedly
title: "bug: "
labels: ["bug", "needs triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to report a bug. Please fill in as much as you can — a
        reproducible report gets fixed much faster.

        ⚠️ For security vulnerabilities, **do not** use this form. Follow
        [SECURITY.md](https://github.com/tanbopp/pagelabs-pdf-tools/blob/main/SECURITY.md).

  - type: input
    id: url
    attributes:
      label: Where did it happen?
      description: The hosted URL, or tell us you are self-hosting.
      placeholder: https://pagelabs.tanbopp.cloud/tools/merge-pdf
    validations:
      required: true

  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      placeholder: The job stayed on "processing" and never finished.
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: What did you expect to happen?
    validations:
      required: true

  - type: textarea
    id: steps
    attributes:
      label: Steps to reproduce
      placeholder: |
        1. Open Merge PDF
        2. Upload two 20 MB PDFs
        3. Click Merge
        4. …
    validations:
      required: true

  - type: input
    id: file
    attributes:
      label: File details (if relevant)
      description: File type, size, page count, and whether it is a scan. Never attach confidential documents.
      placeholder: PDF, 12.4 MB, 84 pages, scanned/shadowed text

  - type: dropdown
    id: environment
    attributes:
      label: Environment
      multiple: true
      options:
        - Hosted (pagelabs.tanbopp.cloud)
        - Self-hosted with docker compose
        - Self-hosted (custom)
        - Local development

  - type: input
    id: browser
    attributes:
      label: Browser and OS
      placeholder: Chrome 131 on Windows 11

  - type: textarea
    id: logs
    attributes:
      label: Console output / logs
      description: Browser console errors or API worker logs. Redact anything private.
      render: shell

  - type: checkboxes
    id: checks
    attributes:
      label: Confirmations
      options:
        - label: I searched existing issues and this is not a duplicate
          required: true
        - label: I am not reporting a security vulnerability here
          required: true
