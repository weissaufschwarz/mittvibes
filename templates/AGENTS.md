# mittwald Extension - Development Guide

## Project Overview
This is a mittwald extension project using React components and API integration with the mittwald platform.

## Package Management & Dependencies
- **Package Manager**: Use `pnpm` exclusively
- **API Client**: Always use `@mittwald/api-client` package's `MittwaldAPIV2Client.newWithToken()` for mittwald API calls
- **UI Components**: ALWAYS use `@mittwald/flow-remote-react-components` instead of standard HTML elements
  - Use `Content` instead of `<div>`
  - Use `Text` instead of `<p>`, `<span>`
  - Use `Heading` instead of `<h1>`, `<h2>`, etc.
  - Use `Button` instead of `<button>`
  - Never use raw HTML elements like `<div>`, `<span>`, `<p>`, `<h1-6>`, `<button>`, etc.
  - Reference: https://mittwald.github.io/flow/03-components/

## Code Standards & Architecture
- always refer to mittwald with lowercase "m"

### Module System
- **ESM Only**: Always use ESM-style imports, never `require()`
- **Import Extensions**: Avoid `.js` extensions in imports, use clean ESM imports
- **Async Patterns**: Prefer `async/await` over Promises or callbacks
- **No Conditional Imports**: Avoid dynamic imports like `const { fetchResourceData } = await import("../../api-client")`

### Environment & Configuration
- **Environment Variables**: Access via `[env.ts]` - all variables are set in process.env
- **Configuration**: The `.env` file exists but is not accessible - assume it exists or ask user to verify

### Testing Strategy
- **Unit Tests**:
  - Colocated with source files, named `*.test.ts`
  - Only for complex logic, keep short and focused
  - Mock only when absolutely necessary (fetch calls, DB calls, slow operations)
- **Error Coverage**: After debugging errors, add tests to prevent regression

### Validation & Data Handling
- **Schema Validation**: Check if Zod is viable for validation needs
- **Error Handling**: Implement comprehensive error handling with appropriate logging

## File Structure & Important Paths

### Core Files
- `[package.json]` - Project dependencies and scripts
- `@env.ts` - Environment variable definitions and access
- **Ignored Files**: Don't consider files in `.gitignore`, except for `tasks/**`

### Development Workflow
- **Git Management**: Don't suggest git commits - handled manually
- **Debugging Process**: Always add test coverage after resolving bugs

## Best Practices
- Maintain clean, readable code following established patterns
- Use TypeScript strictly with proper type definitions
- Follow the existing project structure and naming conventions
- Prioritize performance and maintainability
- Document complex logic inline when necessary