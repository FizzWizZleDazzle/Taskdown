/**
 * Represents a checklist item with completion status
 */
export interface ChecklistItem {
  text: string;
  completed: boolean;
}

/**
 * Represents a Jira-style card with all metadata
 */
export interface Card {
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

/**
 * Represents an Epic containing multiple cards
 */
export interface Epic {
  id: string;
  title: string;
  cards: Card[];
}

/**
 * Represents the complete board data structure
 */
export interface BoardData {
  title?: string;
  epics: Epic[];
}

/**
 * Configuration options for the parser
 */
export interface ParserOptions {
  strictMode?: boolean;
  allowUnknownFields?: boolean;
}

/**
 * Configuration options for the serializer
 */
export interface SerializerOptions {
  includeEmptyFields?: boolean;
  indentSize?: number;
  separateCardsWithHr?: boolean;
}