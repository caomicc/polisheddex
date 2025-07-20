# Copilot Instructions

# NEVER TALK TO ME ABOUT TAILWIND WITH A TAILWIND VERSION OTHER THAN v4.

# THERE IS NO TAILWIND.CONFIG.JS NOR TS FILE IN THIS REPO. THERE IS NO NEED FOR ONE. STOP ASKING.

# THERE IS ONLY A TAILWIND CSS FILE. IT IS IN GLOBALS.CSS. ALL THEME VARIABLES ARE IN THE GLOBALS.CSS FILE.

## extraction function is `npm run extract > log.out`

## UI/Component Coding Standards

- Use clear and descriptive variable names.
- Prefer functional React components and hooks.
- Use Tailwind v4 CSS for styling, with utility classes and the `className` prop.
- Use the `cn` utility to combine class names when needed.
- Use shadcn and radix UI components when more than basic HTML is required; import from the appropriate paths.
- Write accessible, semantic HTML and follow accessibility best practices (e.g., ARIA roles, alt text, `sr-only` for screen readers).
- Use TypeScript for type safety and clear type definitions.
- Follow ESLint and Prettier rules as configured in the repo.
- Organize code and styles in a modular, maintainable way.
- Write tests for components and utilities.

## API/Package Coding Standards

- Use TypeScript for all code and type definitions.
- Use clear, descriptive, and consistent naming for functions, variables, and types.
- Organize code into small, focused modules and functions.
- Prefer named exports over default exports.
- Write pure functions where possible and avoid side effects.
- Handle errors gracefully and explicitly.
- Document functions, types, and modules with JSDoc comments.
- Write unit tests for all exported functions and utilities.
- Follow ESLint and Prettier rules as configured in the repo.

## App (apps/\*) Coding Standards

- Use Next.js App Router and follow Next.js conventions for routing, layouts, and server/client components.
- Use TypeScript for all pages, components, and utilities.
- Use Tailwind v4 CSS for styling, with utility classes and the `className` prop.
- Use the `cn` utility to combine class names when needed.
- Prefer functional React components and hooks.
- Organize code using atomic/component-driven structure (e.g., components, layouts, pages, utils, styles).
- Use shadcn and radix UI components when more than basic HTML is required; import from the appropriate paths.
- Write accessible, semantic HTML and follow accessibility best practices (e.g., ARIA roles, alt text, `sr-only` for screen readers).
- Write clear, descriptive, and consistent naming for files, functions, and variables.
- Handle errors gracefully and explicitly, especially in API routes and server components.
- Write tests for pages, components, and utilities.
- Follow ESLint and Prettier rules as configured in the repo.
- Keep code modular, maintainable, and easy to reason about.

## General Guidelines

- Use Git for version control; commit often with clear, descriptive messages.
- Use pull requests for code reviews and collaboration.
- Write clear, descriptive commit messages that explain the "why" behind changes.
- Keep pull requests small and focused on a single feature or fix.
