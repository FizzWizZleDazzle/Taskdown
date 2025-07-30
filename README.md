# Taskdown

A parser and serializer for converting Jira-style Markdown to structured board data and back. Perfect for managing development epics and cards in a human-readable Markdown format while maintaining the ability to process the data programmatically.

## Features

- **Parse Jira-style Markdown** into structured board data (epics, cards, checklists)
- **Serialize board data** back to Markdown for export
- **Support for checklists** with completion status (Acceptance Criteria, Technical Tasks)
- **Card metadata** including Type, Priority, Story Points, Sprint, Dependencies, and Blocks
- **Multi-epic structure** for organizing large projects
- **Round-trip conversion** maintains data integrity
- **TypeScript support** with full type definitions

## Installation

```bash
npm install
npm run build
```

## Usage

### Programmatic API

```typescript
import { parseMarkdown, serializeToMarkdown } from './src/index';

// Parse Markdown to structured data
const markdown = `
# Project Board
## Epic: User Authentication (AUTH-001)
### AUTH-101: Login System
**Type**: Story
**Priority**: High
**Story Points**: 5
**Description**: Implement user login functionality
**Acceptance Criteria**:
- [ ] Users can enter credentials
- [x] Password validation works
`;

const boardData = parseMarkdown(markdown);
console.log(boardData);

// Serialize back to Markdown
const newMarkdown = serializeToMarkdown(boardData);
console.log(newMarkdown);
```

### CLI Usage

```bash
# Parse Markdown file to JSON
npm run dev -- parse example.md

# Perform round-trip conversion test
npm run dev -- roundtrip example.md

# Show help
npm run dev -- help
```

## Markdown Format

### Board Structure
```markdown
# Board Title

## Epic: Epic Name (EPIC-ID)

### CARD-ID: Card Title

**Type**: Story|Task|Bug|Epic
**Priority**: Critical|High|Medium|Low
**Story Points**: 1-13
**Sprint**: Sprint identifier
**Description**: Card description

**Acceptance Criteria**:
- [ ] Uncompleted item
- [x] Completed item

**Technical Tasks**:
- [ ] Implementation task
- [x] Completed task

**Dependencies**: CARD-1, CARD-2 (or "None")
**Blocks**: CARD-3, CARD-4 (or "None")

---

### CARD-ID-2: Another Card
...
```

## Supported Metadata Fields

- **Type**: Card type (Story, Task, Bug, Epic, etc.)
- **Priority**: Priority level (Critical, High, Medium, Low)
- **Story Points**: Effort estimation (numeric)
- **Sprint**: Sprint or iteration identifier
- **Description**: Detailed card description
- **Acceptance Criteria**: Checklist of completion criteria
- **Technical Tasks**: Checklist of implementation tasks
- **Dependencies**: List of blocking card IDs
- **Blocks**: List of cards this card blocks

## Development

### Build
```bash
npm run build
```

### Test
```bash
npm test
npm run test:watch
```

### Development CLI
```bash
npm run dev -- <command> <args>
```

## API Reference

### Types

#### `BoardData`
```typescript
interface BoardData {
  title?: string;
  epics: Epic[];
}
```

#### `Epic`
```typescript
interface Epic {
  id: string;
  title: string;
  cards: Card[];
}
```

#### `Card`
```typescript
interface Card {
  id: string;
  title: string;
  type?: string;
  priority?: string;
  storyPoints?: number;
  sprint?: string;
  description?: string;
  acceptanceCriteria: ChecklistItem[];
  technicalTasks: ChecklistItem[];
  dependencies?: string[];
  blocks?: string[];
}
```

#### `ChecklistItem`
```typescript
interface ChecklistItem {
  text: string;
  completed: boolean;
}
```

### Functions

#### `parseMarkdown(markdown: string, options?: ParserOptions): BoardData`
Parse Jira-style Markdown into structured board data.

#### `serializeToMarkdown(boardData: BoardData, options?: SerializerOptions): string`
Convert board data back to Jira-style Markdown.

## License

MIT