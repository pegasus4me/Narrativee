# Security Policy

## Reporting a vulnerability

Please do **not** open public GitHub issues for security vulnerabilities.

Instead, report privately to the maintainers with:

- A clear description of the issue
- Steps to reproduce
- Potential impact
- Any suggested mitigation

## Response expectations

We aim to acknowledge reports within 72 hours and provide a status update after
initial triage.

## Secrets handling

- Never commit secrets or credentials
- Use `.env` / environment variables for local and production secrets
- Rotate keys immediately if accidental exposure is detected
