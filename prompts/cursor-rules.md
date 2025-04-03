Always refer to memory-bank to understand the context of the project. Do not code anything outside of the context provided in the memory-bank folder. This folder serves as the knowledge base and contains the fundamental rules and guidelines that should always be followed. If something is unclear, check this folder before proceeding with any coding. I MUST read ALL memory bank files at the start of EVERY task - this is not optional. If no memory bank exists, create one.

## Memory Bank Structure

The Memory Bank consists of core files and optional context files, all in Markdown format. Files build upon each other in a clear hierarchy:

flowchart TD
PB[projectbrief.md] --> PC[productContext.md]
PB --> SP[systemPatterns.md]
PB --> TC[techContext.md]

    PC --> AC[activeContext.md]
    SP --> AC
    TC --> AC

    AC --> P[progress.md]

### Core Files (Required)

1. `projectbrief.md`

   - Foundation document that shapes all other files
   - Created at project start if it doesn't exist
   - Defines core requirements and goals
   - Source of truth for project scope

2. `productContext.md`

   - Why this project exists
   - Problems it solves
   - How it should work
   - User experience goals

3. `activeContext.md`

   - Current work focus
   - Recent changes
   - Next steps
   - Active decisions and considerations
   - Important patterns and preferences
   - Learnings and project insights

4. `systemPatterns.md`

   - System architecture
   - Key technical decisions
   - Design patterns in use
   - Component relationships
   - Critical implementation paths

5. `techContext.md`

   - Technologies used
   - Development setup
   - Technical constraints
   - Dependencies
   - Tool usage patterns

6. `progress.md`
   - What works
   - What's left to build
   - Current status
   - Known issues
   - Evolution of project decisions

### Additional Context

Create additional files/folders within memory-bank/ when they help organize:

- Complex feature documentation
- Integration specifications
- API documentation
- Testing strategies
- Deployment procedures

## Core Workflows

### Plan Mode

flowchart TD
Start[Start] --> ReadFiles[Read Memory Bank]
ReadFiles --> CheckFiles{Files Complete?}

    CheckFiles -->|No| Plan[Create Plan]
    Plan --> Document[Document in Chat]

    CheckFiles -->|Yes| Verify[Verify Context]
    Verify --> Strategy[Develop Strategy]
    Strategy --> Present[Present Approach]

### Act Mode

flowchart TD
Start[Start] --> Context[Check Memory Bank]
Context --> Update[Update Documentation]
Update --> Execute[Execute Task]
Execute --> Document[Document Changes]

## Documentation Updates

Memory Bank updates occur when:

1. Discovering new project patterns
2. After implementing significant changes
3. When user requests with **update memory bank** (MUST review ALL files)
4. When context needs clarification

flowchart TD
Start[Update Process]

    subgraph Process
        P1[Review ALL Files]
        P2[Document Current State]
        P3[Clarify Next Steps]
        P4[Document Insights & Patterns]

        P1 --> P2 --> P3 --> P4
    end

    Start --> Process

Verify Information: Always verify information from the context before presenting it. Do not make assumptions or speculate without clear evidence.

Follow implementation-plan.mdc for Feature Development: When implementing a new feature, strictly follow the steps outlined in implementation-plan.mdc. Every step is listed in sequence, and each must be completed in order. After completing each step, update implementation-plan.mdc with the word "Done" and a two-line summary of what steps were taken. This ensures a clear work log, helping maintain transparency and tracking progress effectively.

File-by-File Changes: Make changes file by file and give the user a chance to spot mistakes.

No Apologies: Never use apologies.

No Understanding Feedback: Avoid giving feedback about understanding in comments or documentation.

No Whitespace Suggestions: Don't suggest whitespace changes.

No Summaries: Do not provide unnecessary summaries of changes made. Only summarize if the user explicitly asks for a brief overview after changes.

No Inventions: Don't invent changes other than what's explicitly requested.

No Unnecessary Confirmations: Don't ask for confirmation of information already provided in the context.

Preserve Existing Code: Don't remove unrelated code or functionalities. Pay attention to preserving existing structures.

Single Chunk Edits: Provide all edits in a single chunk instead of multiple-step instructions or explanations for the same file.

No Implementation Checks: Don't ask the user to verify implementations that are visible in the provided context. However, if a change affects functionality, provide an automated check or test instead of asking for manual verification.

No Unnecessary Updates: Don't suggest updates or changes to files when there are no actual modifications needed.

Provide Real File Links: Always provide links to the real files, not the context-generated file.

No Current Implementation: Don't discuss the current implementation unless the user asks for it or it is necessary to explain the impact of a requested change.

Check Context Generated File Content: Remember to check the context-generated file for the current file contents and implementations.

Use Explicit Variable Names: Prefer descriptive, explicit variable names over short, ambiguous ones to enhance code readability.

Follow Consistent Coding Style: Adhere to the existing coding style in the project for consistency.

Prioritize Performance: When suggesting changes, consider and prioritize code performance where applicable.

Security-First Approach: Always consider security implications when modifying or suggesting code changes.

Test Coverage: Suggest or include appropriate unit tests for new or modified code.

Error Handling: Implement robust error handling and logging where necessary.

Modular Design: Encourage modular design principles to improve code maintainability and reusability.

Version Compatibility: Ensure suggested changes are compatible with the project's specified language or framework versions. If a version conflict arises, suggest an alternative or provide a backward-compatible solution.

Avoid Magic Numbers: Replace hardcoded values with named constants to improve code clarity and maintainability.

Consider Edge Cases: When implementing logic, always consider and handle potential edge cases.

Use Assertions: Include assertions wherever possible to validate assumptions and catch potential errors early.

- Always look for existing code to iterate on instead of creating new code.
- Do not drastically change the patterns before trying to iterate on existing patterns.
- Always kill all existing related servers that may have been created in previous testing before trying to start a new server.
- Always prefer simple solutions
- Avoid duplication of code whenever possible, which means checking for other areas of the codebase that might already have similar code and functionality
- Write code that takes into account the different environments: dev, test, and prod
- You are careful to only make changes that are requested or you are confident are well understood and related to the change being requested
- When fixing an issue or bug, do not introduce a new pattern or technology without first exhausting all options for the existing implementation. And if you finally do this, make sure to remove the old implementation afterwards so we don't have duplicate logic.
- Keep the codebase very clean and organized
- Avoid writing scripts in files if possible, especially if the script is likely only to be run once
- Avoid having files over 200-300 lines of code. Refactor at that point.
- Mocking data is only needed for tests, never mock data for dev or prod
- Never add stubbing or fake data patterns to code that affects the dev or prod environments
- Never overwrite my .env file without first asking and confirming
- Focus on the areas of code relevant to the task
- Do not touch code that is unrelated to the task
- Avoid making major changes to the patterns and architecture of how a feature works, after it has shown to work well, unless explicitly instructed
- Always think about what other methods and areas of code might be affected by code changes
