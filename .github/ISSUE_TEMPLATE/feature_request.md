name: Feature request
description: Suggest a new tool, option, or improvement
title: "feat: "
labels: ["enhancement", "needs triage"]
body:
  - type: markdown
    attributes:
      value: |
        Have an idea that would make PageLabs better? Tell us the problem first — the solution
        is easier to agree on once we understand the use case.

  - type: textarea
    id: problem
    attributes:
      label: What problem are you trying to solve?
      placeholder: I regularly need to remove every blank page from long reports and have to do it by hand.
    validations:
      required: true

  - type: textarea
    id: proposal
    attributes:
      label: Proposed solution
      description: Describe the tool or behaviour you would like to see.
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives you have considered
      placeholder: Other sites, scripts, manual workarounds.

  - type: dropdown
    id: area
    attributes:
      label: Area
      options:
        - New tool
        - Existing tool improvement
        - Performance
        - Accessibility
        - Design / UI
        - Documentation
        - Self-hosting
        - Other

  - type: dropdown
    id: willing
    attributes:
      label: Would you like to work on this yourself?
      options:
        - "No, just suggesting"
        - "Yes, I can open a pull request"
        - "Maybe, with some guidance"

  - type: checkboxes
    id: checks
    attributes:
      label: Confirmations
      options:
        - label: I searched existing issues and discussions first
          required: true
