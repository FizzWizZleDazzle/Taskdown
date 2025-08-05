export * from './types';
export { MarkdownParser } from './parser';
export { MarkdownSerializer } from './serializer';

/**
 * Convenience function to parse Markdown and return board data
 */
import { MarkdownParser } from './parser';
import { ParserOptions } from './types';

export function parseMarkdown(markdown: string, options?: ParserOptions) {
  const parser = new MarkdownParser(options);
  return parser.parse(markdown);
}

/**
 * Convenience function to serialize board data to Markdown
 */
import { MarkdownSerializer } from './serializer';
import { BoardData, SerializerOptions } from './types';

export function serializeToMarkdown(boardData: BoardData, options?: SerializerOptions) {
  const serializer = new MarkdownSerializer(options);
  return serializer.serialize(boardData);
}