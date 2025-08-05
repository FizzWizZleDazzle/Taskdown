# Taskdown - GitHub Copilot Instructions

## Project Overview
Taskdown is a React TypeScript application that provides a visual Kanban board interface for managing development tasks. The core feature is a parser that converts Jira-style Markdown into structured board data and back, enabling seamless integration between human-readable documentation and programmatic task management.

## Architecture

### Core Components
- **Parser** (`src/parser.ts`): Converts Jira-style Markdown to structured data
- **Serializer** (`src/serializer.ts`): Converts structured data back to Markdown
- **Board UI** (`src/components/Board.tsx`): Visual Kanban board with drag-and-drop
- **CLI** (`src/cli.ts`): Command-line interface for parsing operations

### Key Types
- `BoardData`: Contains title and epics array
- `Epic`: Has id, title, and cards array
- `Card`: Contains metadata (type, priority, story points, etc.) and checklists
- `ChecklistItem`: Text and completion status for acceptance criteria/technical tasks

## Development Guidelines

### Code Style
- Use TypeScript with strict type checking
- Follow React hooks patterns (see `src/hooks/useLocalStorage.ts`)
- Prefer functional components over class components
- Use CSS modules for styling (see existing `.css` files)

### Testing
- Jest for unit testing with comprehensive coverage
- Test files in `src/__tests__/` directory
- Include integration tests for parser round-trip conversion
- Use React Testing Library for component tests

### Parser Development
- Markdown parsing follows specific Jira-style format (see `example.md`)
- Support for metadata fields: Type, Priority, Story Points, Sprint, Description
- Checklists: Acceptance Criteria and Technical Tasks with `- [ ]`/`- [x]` syntax
- Dependencies and blocking relationships between cards

### UI Development
- Use `@dnd-kit` for drag-and-drop functionality
- Maintain responsive design principles
- Cards display all metadata in readable format
- Board state persists in localStorage

### Build and Deployment
- Webpack for bundling
- Production builds to `dist/` directory
- GitHub Pages deployment ready
- CLI available via `npm run parse`

## Common Tasks

### Adding New Card Metadata
1. Update `Card` interface in `src/types.ts`
2. Modify parser logic in `src/parser.ts`
3. Update serializer in `src/serializer.ts`
4. Add UI display in card components
5. Write tests for new functionality

### Modifying Board UI
1. Components in `src/components/` directory
2. Use existing drag-and-drop patterns
3. Maintain accessibility standards
4. Test with sample data from `src/sampleData.ts`

### CLI Enhancements
1. Extend `src/cli.ts` with new commands
2. Follow existing error handling patterns
3. Support both workspace and standalone usage
4. Update help text and examples

## File Structure Patterns
- React components: PascalCase (e.g., `Board.tsx`)
- Utilities and services: camelCase (e.g., `parser-utils.ts`)
- Tests: `*.test.ts` or `*.test.tsx`
- Types: Centralized in `src/types.ts`

## Best Practices
- Always run tests before committing (`npm test`)
- Use the CLI for testing parser changes (`npm run parse -- roundtrip example.md`)
- Maintain backward compatibility in parser format
- Document new markdown format extensions
- Consider accessibility in UI changes

## Dependencies
- React 18+ for UI framework
- TypeScript for type safety
- @dnd-kit for drag-and-drop
- Jest for testing
- Webpack for building

When working on this project, focus on maintaining the clean separation between parsing logic and UI components, ensuring robust error handling, and preserving the round-trip conversion capability that is core to the project's value proposition.