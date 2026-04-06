# getuserfeedback GTM Template

Google Tag Manager Community Template Gallery source for the getuserfeedback widget.

This repository publishes the root gallery artifact:
- `template.tpl`
- `metadata.yaml`

The template itself is generated from the published `@getuserfeedback/adapters` package.

## What the template supports

- Current getuserfeedback loader script and init contract
- GTM Consent Mode integration
- Automatic and manual consent mapping
- Analytics measurement policy controls
- Public identify support with:
  - intelligent mode
  - disabled mode
  - advanced mode
- Theme configuration for fixed, system, host-matched, and GTM-variable-driven setups

## Known limitation

Explicit public navigation/router updates are not yet exposed by this template.

## Local checks

Use Bun in this repo.

```bash
bun run generate:template
bun test --dots
```

## Publishing

For Community Template Gallery publication, the repository root contains the files Google expects:
- `template.tpl`
- `metadata.yaml`
- `LICENSE`
