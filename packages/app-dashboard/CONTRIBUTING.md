# Contributing to the Vincent Dashboard

## Setup

1. Follow global setup at repository root [README.md](../../README.md)
2. Copy `.env.example` to `.env` and fill in the values.
3. Run `dev` script to start the dashboard in development mode.

# Rules for development
1. Always use Typescript. Prefer `unknown` over `any` if possible, and only use them when applicable or needed. Implement clear types and respect them in params or return types 
2. Prefer React functional components with hooks over class components
3. Use app root imports with `@/` alias over relative backwards imports
4. Apply styling globally on components under `@/components/ui`. Avoid styling components inline unless they are exceptions or positioning properties relative to other components
5. Routing is based on directories under `@/pages`
6. Pages should be as minimal as possible, ideally just rendering their components and their positions
7. Separate business logic in hooks and utility functions and avoid placing them in components. Respect the Single Responsibility Principle.
8. Components should be focused in UI, the View of the MVC pattern
9. Use `@/config/env` as the source of truth and validator for environment variables
10. Avoid unhealthy patterns such as log-and-rethrow errors
11. Notify users about the process status and updates. Don't hide results from them
12. Prioritize readable and concise code, optimized for human review and audit. Security is a must and cannot be compromised
13. When code gets too complicated, document it for future review
14. Respect linting rules
15. Avoid re-renders with `useMemo` and `useCallback`
16. Use `react-router` to handle routing params or moving user around
17. Think in terms of multiple blockchains. Not only Ethereum or EVM but also Solana or SUI can be used
18. Create easy to use visuals and respect the design system, sharing components when possible, to enhance user experience and familiarity
19. Be clear on texts displayed to the user
20. Minimize the exposed interfaces and consider future upgrades when defining it
