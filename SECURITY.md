# Security Policy

## Supported Versions

Security fixes are handled for the `main` branch and the latest deployed version of this project.

## Reporting a Vulnerability

Please report security issues privately. Use GitHub Security Advisories if they are enabled for this repository. If advisories are not available, contact the repository owner by email.

Do not open a public issue for a suspected vulnerability.

## What to Include

Include enough detail for the maintainer to reproduce and assess the issue:

- Steps to reproduce
- Affected route, page, API endpoint, or admin workflow
- Screenshots, logs, or request/response samples when available
- Expected impact and any data that may be exposed or modified
- Browser, account role, and environment details if relevant

## Response Expectations

The maintainer will make a best-effort response within 7 days, then coordinate validation and remediation based on severity and project availability.

## Scope

Reports are especially useful for:

- Admin authentication or authorization bypass
- Supabase RLS, service-role, or server/client boundary misuse
- File upload or import handling issues
- Cross-site scripting, including stored or reflected XSS
- Sensitive data exposure through public routes, admin routes, logs, or client bundles

Out-of-scope reports may be closed without a fix if they require unrealistic access, social engineering, denial-of-service testing, or changes outside this repository.
