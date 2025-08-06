# Taskdown

![CI](https://github.com/FizzWizZleDazzle/Taskdown/workflows/CI/badge.svg)
![Deploy](https://github.com/FizzWizZleDazzle/Taskdown/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)

A React TypeScript application with a visual Kanban board interface and parser that converts Jira-style Markdown to structured board data and back. Perfect for managing development tasks with seamless integration between human-readable documentation and programmatic task management.

## 🚀 Live Demo

Visit the live application: [https://FizzWizZleDazzle.github.io/Taskdown](https://FizzWizZleDazzle.github.io/Taskdown)

## Structure

- `src/` - React TypeScript application with visual Kanban board
- `src/parser.ts` - Core parser for Jira-style Markdown  
- `src/serializer.ts` - Serializer for converting back to Markdown
- `src/components/` - React components for the board UI
- `src/cli.ts` - Command-line interface for parsing operations
- `backend/` - Rust backend server implementing Remote Workspace API
- `cloudflare-backend/` - Cloudflare Workers implementation of the backend

## Quick Start

### Web Application

Visit the live demo at [https://FizzWizZleDazzle.github.io/Taskdown](https://FizzWizZleDazzle.github.io/Taskdown) or run locally:

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### CLI Usage

From the project root:

```bash
# Install all dependencies
npm install

# Start the web application
npm start

# Build the application
npm run build

# Test the parser
npm test

# Use the CLI
npm run parse -- parse example.md
```

## 🎯 Features

### Visual Kanban Board
- **Drag & Drop**: Move cards between epics and reorder within epics
- **Real-time Updates**: Changes persist automatically using localStorage
- **Responsive Design**: Works on desktop and mobile devices
- **Card Metadata**: Display all Jira-style metadata in an organized layout

### Parser & CLI

A parser and serializer for converting Jira-style Markdown to structured board data and back. Perfect for managing development epics and cards in a human-readable Markdown format while maintaining the ability to process the data programmatically.

#### Features

- **Parse Jira-style Markdown** into structured board data (epics, cards, checklists)
- **Serialize board data** back to Markdown for export
- **Support for checklists** with completion status (Acceptance Criteria, Technical Tasks)
- **Card metadata** including Type, Priority, Story Points, Sprint, Dependencies, and Blocks
- **Multi-epic structure** for organizing large projects
- **Round-trip conversion** maintains data integrity
- **TypeScript support** with full type definitions

## Installation & Development

### Prerequisites
- Node.js 18.x or 20.x
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/FizzWizZleDazzle/Taskdown.git
cd Taskdown

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Usage

### Programmatic API

```typescript
import { parseMarkdown, serializeToMarkdown } from './packages/taskdown-parser/src/index';

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
npm run dev:parser -- parse example.md

# Perform round-trip conversion test
npm run dev:parser -- roundtrip example.md

# Show help
npm run dev:parser -- help
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

### CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

- **CI Workflow**: Runs on every push and pull request to `main` and `develop` branches
  - Tests on Node.js 18.x and 20.x
  - Runs unit tests and integration tests
  - Builds the application
  - Tests CLI functionality

- **Deploy Workflow**: Automatically deploys to GitHub Pages on push to `main` branch
  - Builds the production application
  - Deploys to GitHub Pages
  - Available at: https://FizzWizZleDazzle.github.io/Taskdown

### Build
```bash
# Build the application
npm run build

# The build output will be in the dist/ directory
# This is what gets deployed to GitHub Pages
```

### Test
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Development CLI
```bash
npm run parse -- <command> <args>
```

### GitHub Copilot Integration

This project includes comprehensive GitHub Copilot instructions in `.github/copilot-instructions.md` to help AI assistants understand the project structure, coding patterns, and development guidelines. This enables more accurate and helpful code suggestions when working with the codebase.

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