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
- net-new components should be lower-case, hyphenated, and follow the `ComponentName` format (e.g., `pokemon-card`).
- Use TypeScript for all components and utilities.
- If you see a component that is not following the naming convention, suggest a change to the name.
- If there is a stateful component that can be converted to a functional component, suggest that change.
- If a hook like useState or useEffect is used, ensure it is necessary and not overused. If it is necessary, ensure it is on a client side component.
- Write accessible, semantic HTML and follow accessibility best practices (e.g., ARIA roles, alt text, `sr-only` for screen readers).

## Typescript Coding Standards

- Use TypeScript for type safety and clear type definitions.
- Prefer interface over type for object shapes.
- When creating types, use clear, descriptive names that reflect the purpose of the type.
- If there is a need for a type that is only used in one place, consider using inline types instead of creating a separate type.
- If there are a lot of types that are similar, consider creating a union type a mapped type to reduce duplication, or suggest a more generic type that can be reused.

## Assembly + Rom source extraction

- The point of the project is to extract data from within the custom pokemon Rom source code. It is a untracked folder in the repo under `/rom`
- Files generated should be placed in the `/output` directory.
- The key values between the assembly files are inconsistent.
- We have been working with pokemon species as keys, however some pokemon have additional forms that are part of the file name, but these are not their own pokemon. We call these "forms".
- The assembly files are in a custom format that is not standard. They are not JSON, YAML, or any other standard format. They are a custom format that is specific to the pokemon Rom source code.
- The assembly files are not in a standard format, so you will need to parse them manually.
- There are `if DEF(FAITHFUL)` flags throughout the assembly files. The flag "FAITHFUL" is one that the user chooses on start up. It allows the user to play the game the way it was intended, or with some quality of life improvements. The user can choose to play the game with or without these flags.
- If there is a faithful flag, understand that the other side of the if/else statement is the "polished" version of the data. The faithful version is the original data, and the polished version is the new and improved data. When extracting data, I need to have both versions of the data. They can live side by side in the same file, but clearly separated via a tag or property.
- Examples of things that could be faithful vs polished:
  - Moves: The faithful version of a move may have a different name, power, accuracy, or effect than the polished version.
  - Abilities: The faithful version of an ability may have a different effect or name than the polished version.
  - Items: The faithful version of an item may have a different effect or name than the polished version.
  - Pokemon: The faithful version of a pokemon may have different stats, types, or abilities than the polished version.
  - There may be more versions that I have not accounted for because I am currently unaware.
- The extraction process should be able to handle both the faithful and polished versions of the data at once.
- If the extraction files become to long and are becoming tedious to process, consider breaking them up into smaller files or modules.
- If there are any files that are not being used, remove them from the extraction process and delete their output if it is not needed.
- If the information in each output file is not consistent, suggest a way to make it consistent. For example, if some files have a `name` property and others do not, suggest adding a `name` property to all files.
- To keep object size small, avoid nesting objects too deeply. If we need to store multiple related properties, consider using a flat structure or a single object with multiple properties instead of deeply nested objects.
- This information will be exported as a JSON file so it can be used on a Next.JS Web App. We can import many JSON files if applicable, so if the data is too large to fit in a single file, consider breaking it up into smaller files or modules.
- Use the `npm run extract` command to run the extraction process. This will generate the output files in the `/output` directory.

## Prettier and Tests

- Write unit tests for all exported functions and utilities.
- Follow Prettier rules as configured in the repo.
- Prettier should be run on save.
- Organize code and styles in a modular, maintainable way.
- Write tests for components and utilities as needed.
- Any test should be placed into a /src/tests directory for organization.

## API/Package Coding Standards

- Use TypeScript for all code and type definitions.
- Use clear, descriptive, and consistent naming for functions, variables, and types.
- Organize code into small, focused modules and functions.
- Prefer named exports over default exports.
- Write pure functions where possible and avoid side effects.
- Handle errors gracefully and explicitly.
- Document functions, types, and modules with JSDoc comments.
- Any documentation written should be placed into a /docs directory for organization.
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
- Follow Prettier rules as configured in the repo.
- Keep code modular, maintainable, and easy to reason about.

## General Guidelines

- Use Git for version control; commit often with clear, descriptive messages.
- Use pull requests for code reviews and collaboration.
- Write clear, descriptive commit messages that explain the "why" behind changes.
- Keep pull requests small and focused on a single feature or fix.
