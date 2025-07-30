import { MarkdownParser } from '../parser';
import { MarkdownSerializer } from '../serializer';
import { parseMarkdown, serializeToMarkdown } from '../index';
import * as fs from 'fs';
import * as path from 'path';

describe('Integration Tests', () => {
  let exampleMarkdown: string;

  beforeAll(() => {
    // Read the example.md file
    const examplePath = path.join(__dirname, '../../example.md');
    exampleMarkdown = fs.readFileSync(examplePath, 'utf-8');
  });

  describe('Round-trip conversion', () => {
    it('should parse and serialize example.md correctly', () => {
      const parser = new MarkdownParser();
      const serializer = new MarkdownSerializer();
      
      // Parse the example markdown
      const boardData = parser.parse(exampleMarkdown);
      
      // Verify the parsed data structure
      expect(boardData.title).toBe('Jira Cards - Bevy Editor & Launcher');
      expect(boardData.epics).toHaveLength(1);
      
      const epic = boardData.epics[0];
      expect(epic.id).toBe('LAUNCH-001');
      expect(epic.title).toBe('Launcher Core Functionality');
      expect(epic.cards.length).toBeGreaterThan(0);
      
      // Serialize back to markdown
      const serializedMarkdown = serializer.serialize(boardData);
      
      // Basic structure should be maintained
      expect(serializedMarkdown).toContain('# Jira Cards - Bevy Editor & Launcher');
      expect(serializedMarkdown).toContain('## Epic: Launcher Core Functionality (LAUNCH-001)');
      expect(serializedMarkdown).toContain('### LAUNCH-101: Project Management System');
      expect(serializedMarkdown).toContain('### LAUNCH-102: Editor Version Management');
    });

    it('should handle round-trip with convenience functions', () => {
      // Parse using convenience function
      const boardData = parseMarkdown(exampleMarkdown);
      
      // Serialize using convenience function
      const markdown = serializeToMarkdown(boardData);
      
      // Parse again to verify consistency
      const boardData2 = parseMarkdown(markdown);
      
      // Should have same structure
      expect(boardData2.title).toBe(boardData.title);
      expect(boardData2.epics.length).toBe(boardData.epics.length);
      
      if (boardData.epics.length > 0 && boardData2.epics.length > 0) {
        expect(boardData2.epics[0].id).toBe(boardData.epics[0].id);
        expect(boardData2.epics[0].title).toBe(boardData.epics[0].title);
        expect(boardData2.epics[0].cards.length).toBe(boardData.epics[0].cards.length);
      }
    });
  });

  describe('Data integrity', () => {
    it('should preserve all card metadata through round-trip', () => {
      const parser = new MarkdownParser();
      const serializer = new MarkdownSerializer();
      
      const boardData = parser.parse(exampleMarkdown);
      const markdown = serializer.serialize(boardData);
      const boardData2 = parser.parse(markdown);
      
      // Check first card in detail
      if (boardData.epics.length > 0 && boardData.epics[0].cards.length > 0) {
        const originalCard = boardData.epics[0].cards[0];
        const roundTripCard = boardData2.epics[0].cards[0];
        
        expect(roundTripCard.id).toBe(originalCard.id);
        expect(roundTripCard.title).toBe(originalCard.title);
        expect(roundTripCard.type).toBe(originalCard.type);
        expect(roundTripCard.priority).toBe(originalCard.priority);
        expect(roundTripCard.storyPoints).toBe(originalCard.storyPoints);
        expect(roundTripCard.sprint).toBe(originalCard.sprint);
        expect(roundTripCard.description).toBe(originalCard.description);
        
        // Check acceptance criteria
        expect(roundTripCard.acceptanceCriteria.length).toBe(originalCard.acceptanceCriteria.length);
        for (let i = 0; i < originalCard.acceptanceCriteria.length; i++) {
          expect(roundTripCard.acceptanceCriteria[i].text).toBe(originalCard.acceptanceCriteria[i].text);
          expect(roundTripCard.acceptanceCriteria[i].completed).toBe(originalCard.acceptanceCriteria[i].completed);
        }
        
        // Check technical tasks
        expect(roundTripCard.technicalTasks.length).toBe(originalCard.technicalTasks.length);
        for (let i = 0; i < originalCard.technicalTasks.length; i++) {
          expect(roundTripCard.technicalTasks[i].text).toBe(originalCard.technicalTasks[i].text);
          expect(roundTripCard.technicalTasks[i].completed).toBe(originalCard.technicalTasks[i].completed);
        }
        
        // Check dependencies and blocks
        expect(roundTripCard.dependencies).toEqual(originalCard.dependencies);
        expect(roundTripCard.blocks).toEqual(originalCard.blocks);
      }
    });
  });

  describe('Error handling', () => {
    it('should handle empty markdown gracefully', () => {
      const result = parseMarkdown('');
      expect(result.epics).toHaveLength(0);
    });

    it('should handle malformed markdown gracefully', () => {
      const malformedMarkdown = `
# Title
Some random text
### Card without epic
**Type**: Story
      `;
      
      const result = parseMarkdown(malformedMarkdown);
      expect(result.title).toBe('Title');
      // Should not crash, even with malformed input
    });

    it('should handle missing metadata gracefully', () => {
      const minimalMarkdown = `
## Epic: Test (TEST-001)
### CARD-001: Minimal Card
      `;
      
      const result = parseMarkdown(minimalMarkdown);
      expect(result.epics).toHaveLength(1);
      expect(result.epics[0].cards).toHaveLength(1);
      
      const card = result.epics[0].cards[0];
      expect(card.id).toBe('CARD-001');
      expect(card.title).toBe('Minimal Card');
      expect(card.acceptanceCriteria).toHaveLength(0);
      expect(card.technicalTasks).toHaveLength(0);
    });
  });
});