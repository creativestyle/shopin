# @core/eslint-config

Shared ESLint configuration (TypeScript, React, Jest, Prettier) for the monorepo.

## Usage

Extend in package `eslint.config.js`:

```js
import { config } from "@core/eslint-config/base";
export default config;
```

Other packages in the monorepo reference this for consistent linting.
