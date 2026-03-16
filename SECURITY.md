# Security

## Reporting a vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

- **Do not** open a public GitHub issue.
- Email the repository maintainers with a description of the issue and steps to reproduce.

We will acknowledge your report and work on a fix. We appreciate your help in disclosing security issues in a responsible manner.

## Sensitive files (do not commit)

- `.env`, `.env.local`, and any file containing secrets or API keys
- Keys, tokens, or credentials (Commercetools, Contentful, JWT/CSRF keys, etc.)

Use `.env.example` as a template and keep real values only in local or CI secrets.
