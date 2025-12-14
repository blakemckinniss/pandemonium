# Suggested Commands

## Development

```bash
# Start dev server with HMR
npm run dev

# Production build (TypeScript + Vite)
npm run build

# Preview production build
npm run preview
```

## Code Quality

```bash
# Lint with ESLint
npm run lint

# Type check only
npx tsc --noEmit
```

## Testing

```bash
# Run tests (Vitest)
npm run test

# Run tests in watch mode
npx vitest

# Run tests with UI
npx vitest --ui

# Run specific test file
npx vitest src/game/actions.test.ts
```

## Package Management

```bash
# Install dependencies
npm install

# Add new dependency
npm install <package>

# Add dev dependency
npm install -D <package>
```

## Git Workflow

```bash
git status
git diff
git add <files>
git commit -m "message"
```

## Useful Checks

```bash
# Check TypeScript errors
npx tsc --noEmit

# Check bundle size
npm run build && ls -la dist/assets/

# Check for outdated packages
npm outdated
```
