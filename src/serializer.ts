import { BoardData, Epic, Card, ChecklistItem, SerializerOptions } from './types';

/**
 * Serializer class for converting board data to Jira-style Markdown
 */
export class MarkdownSerializer {
  private options: SerializerOptions;

  constructor(options: SerializerOptions = {}) {
    this.options = {
      includeEmptyFields: false,
      indentSize: 2,
      separateCardsWithHr: true,
      ...options
    };
  }

  /**
   * Serialize BoardData structure to Markdown
   */
  serialize(boardData: BoardData): string {
    const lines: string[] = [];
    
    // Add board title if present
    if (boardData.title) {
      lines.push(`# ${boardData.title}`);
      lines.push('');
    }
    
    // Serialize each epic
    for (let epicIndex = 0; epicIndex < boardData.epics.length; epicIndex++) {
      const epic = boardData.epics[epicIndex];
      
      // Add epic separator if not first epic
      if (epicIndex > 0) {
        lines.push('');
        lines.push('');
      }
      
      // Add epic header
      lines.push(`## Epic: ${epic.title} (${epic.id})`);
      lines.push('');
      
      // Serialize each card in the epic
      for (let cardIndex = 0; cardIndex < epic.cards.length; cardIndex++) {
        const card = epic.cards[cardIndex];
        
        // Add card separator if not first card
        if (cardIndex > 0 && this.options.separateCardsWithHr) {
          lines.push('');
          lines.push('---');
        }
        
        lines.push('');
        
        // Add card header
        lines.push(`### ${card.id}: ${card.title}`);
        lines.push('');
        
        // Add card metadata
        this.addCardMetadata(lines, card);
        
        // Add description if present
        if (card.description) {
          lines.push('');
          lines.push(`**Description**: ${card.description}`);
          lines.push('');
        }
        
        // Add acceptance criteria
        if (card.acceptanceCriteria.length > 0) {
          lines.push('');
          lines.push('**Acceptance Criteria**:');
          lines.push('');
          this.addChecklist(lines, card.acceptanceCriteria);
        }
        
        // Add technical tasks
        if (card.technicalTasks.length > 0) {
          lines.push('');
          lines.push('**Technical Tasks**:');
          lines.push('');
          this.addChecklist(lines, card.technicalTasks);
        }
        
        // Add dependencies and blocks
        this.addDependenciesAndBlocks(lines, card);
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Add card metadata fields to the lines array
   */
  private addCardMetadata(lines: string[], card: Card): void {
    if (card.type || this.options.includeEmptyFields) {
      lines.push(`**Type**: ${card.type || ''}  `);
      lines.push('');
    }
    
    if (card.priority || this.options.includeEmptyFields) {
      lines.push(`**Priority**: ${card.priority || ''}  `);
      lines.push('');
    }
    
    if (card.storyPoints !== undefined || this.options.includeEmptyFields) {
      lines.push(`**Story Points**: ${card.storyPoints || ''}  `);
      lines.push('');
    }
    
    if (card.sprint || this.options.includeEmptyFields) {
      lines.push(`**Sprint**: ${card.sprint || ''}  `);
      lines.push('');
    }
  }

  /**
   * Add checklist items to the lines array
   */
  private addChecklist(lines: string[], items: ChecklistItem[]): void {
    for (const item of items) {
      const checkbox = item.completed ? '[x]' : '[ ]';
      lines.push(`- ${checkbox} ${item.text}`);
      lines.push('');
    }
  }

  /**
   * Add dependencies and blocks fields to the lines array
   */
  private addDependenciesAndBlocks(lines: string[], card: Card): void {
    lines.push('');
    
    // Dependencies
    const deps = card.dependencies && card.dependencies.length > 0 
      ? card.dependencies.join(', ') 
      : 'None';
    lines.push(`**Dependencies**: ${deps}  `);
    
    // Blocks
    const blocks = card.blocks && card.blocks.length > 0 
      ? card.blocks.join(', ') 
      : 'None';
    lines.push(`**Blocks**: ${blocks}`);
    
    lines.push('');
  }
}