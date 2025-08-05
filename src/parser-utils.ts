// Re-export parser functionality for the main application
import { MarkdownParser } from './parser';
import { MarkdownSerializer } from './serializer';
import { BoardData } from './types';

export { MarkdownParser } from './parser';
export { MarkdownSerializer } from './serializer';
export type { 
  BoardData, 
  Epic, 
  Card, 
  ChecklistItem, 
  ParserOptions, 
  SerializerOptions 
} from './types';

/**
 * Convenience function to parse Markdown content
 * @param content - Markdown content to parse
 * @returns Parsed BoardData object
 */
export function parseMarkdown(content: string): BoardData {
  const parser = new MarkdownParser();
  return parser.parse(content);
}

/**
 * Convenience function to serialize BoardData to Markdown
 * @param boardData - BoardData to serialize
 * @returns Markdown string
 */
export function serializeToMarkdown(boardData: BoardData): string {
  const serializer = new MarkdownSerializer();
  return serializer.serialize(boardData);
}