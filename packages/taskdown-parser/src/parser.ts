import { BoardData, Epic, Card, ChecklistItem, ParserOptions } from './types';

/**
 * Parser class for converting Jira-style Markdown to board data
 */
export class MarkdownParser {
  private options: ParserOptions;

  constructor(options: ParserOptions = {}) {
    this.options = {
      strictMode: false,
      allowUnknownFields: true,
      ...options
    };
  }

  /**
   * Parse Markdown content into BoardData structure
   */
  parse(markdown: string): BoardData {
    const lines = markdown.split('\n');
    const boardData: BoardData = { epics: [] };
    
    let currentEpic: Epic | null = null;
    let currentCard: Card | null = null;
    let currentSection: 'none' | 'acceptanceCriteria' | 'technicalTasks' = 'none';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Parse board title (H1)
      if (line.startsWith('# ') && !boardData.title) {
        boardData.title = line.substring(2).trim();
        continue;
      }
      
      // Parse epic (H2)
      if (line.startsWith('## Epic: ')) {
        // Save previous card if exists
        if (currentCard && currentEpic) {
          currentEpic.cards.push(currentCard);
        }
        
        // Save previous epic if exists
        if (currentEpic) {
          boardData.epics.push(currentEpic);
        }
        
        const epicMatch = line.match(/^## Epic: (.+) \(([^)]+)\)$/);
        if (epicMatch) {
          currentEpic = {
            id: epicMatch[2],
            title: epicMatch[1],
            cards: []
          };
        }
        currentCard = null;
        currentSection = 'none';
        continue;
      }
      
      // Parse card (H3)
      if (line.startsWith('### ')) {
        // Save previous card if exists
        if (currentCard && currentEpic) {
          currentEpic.cards.push(currentCard);
        }
        
        const cardMatch = line.match(/^### ([^:]+): (.+)$/);
        if (cardMatch) {
          currentCard = {
            id: cardMatch[1],
            title: cardMatch[2],
            acceptanceCriteria: [],
            technicalTasks: []
          };
        }
        currentSection = 'none';
        continue;
      }
      
      // Parse card metadata (bold fields)
      if (line.startsWith('**') && line.includes('**:') && currentCard) {
        const metadataMatch = line.match(/^\*\*([^*]+)\*\*:\s*(.*)$/);
        if (metadataMatch) {
          const field = metadataMatch[1].toLowerCase().replace(/\s+/g, '');
          const value = metadataMatch[2].trim();
          
          switch (field) {
            case 'type':
              currentCard.type = value;
              break;
            case 'priority':
              currentCard.priority = value;
              break;
            case 'storypoints':
              currentCard.storyPoints = parseInt(value, 10) || undefined;
              break;
            case 'sprint':
              currentCard.sprint = value;
              break;
            case 'description':
              currentCard.description = value;
              break;
            case 'dependencies':
              currentCard.dependencies = value === 'None' ? [] : value.split(',').map(d => d.trim());
              break;
            case 'blocks':
              currentCard.blocks = value === 'None' ? [] : value.split(',').map(b => b.trim());
              break;
            case 'acceptancecriteria':
              currentSection = 'acceptanceCriteria';
              break;
            case 'technicaltasks':
              currentSection = 'technicalTasks';
              break;
          }
        }
        continue;
      }
      
      // Parse checklist items
      if (line.startsWith('- [')) {
        const checklistMatch = line.match(/^- \[([ x])\] (.+)$/);
        if (checklistMatch && currentCard) {
          const item: ChecklistItem = {
            text: checklistMatch[2],
            completed: checklistMatch[1] === 'x'
          };
          
          if (currentSection === 'acceptanceCriteria') {
            currentCard.acceptanceCriteria.push(item);
          } else if (currentSection === 'technicalTasks') {
            currentCard.technicalTasks.push(item);
          }
        }
        continue;
      }
      
      // Handle separator (---)
      if (line.startsWith('---')) {
        currentSection = 'none';
        continue;
      }
    }
    
    // Save final card and epic
    if (currentCard && currentEpic) {
      currentEpic.cards.push(currentCard);
    }
    if (currentEpic) {
      boardData.epics.push(currentEpic);
    }
    
    return boardData;
  }
}