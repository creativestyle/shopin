# Contributing

Thank you for your interest in contributing to the SHOPin storefront accelerator.

## Development setup

1. Clone the repository and install dependencies: `npm ci`
2. Copy `.env.example` to `.env` and set required variables (see [README](README.md)).
3. Run `npm run setup` then `npm run dev`.

## Code quality

- Run `npm run lint` and `npm run format` before committing.
- Run `npm run check-types` to verify TypeScript.
- Ensure tests pass: `npm run test`.

## Submitting changes

- Open an issue or pull request in the project repository.
- Keep commits focused and messages clear.
- Do not commit `.env` or any file containing secrets; use `.env.example` as a template only.

## License

By contributing, you agree that your contributions will be licensed under the [Open Software License 3.0 (OSL-3.0)](LICENSE).
