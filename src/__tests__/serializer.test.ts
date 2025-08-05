import { MarkdownSerializer } from '../serializer';
import { BoardData, Epic, Card, ChecklistItem } from '../types';

describe('MarkdownSerializer', () => {
  let serializer: MarkdownSerializer;

  beforeEach(() => {
    serializer = new MarkdownSerializer();
  });

  describe('basic serialization', () => {
    it('should serialize board title', () => {
      const boardData: BoardData = {
        title: 'My Board Title',
        epics: []
      };
      
      const result = serializer.serialize(boardData);
      expect(result).toContain('# My Board Title');
    });

    it('should serialize empty board', () => {
      const boardData: BoardData = {
        epics: []
      };
      
      const result = serializer.serialize(boardData);
      expect(result.trim()).toBe('');
    });

    it('should serialize single epic', () => {
      const boardData: BoardData = {
        epics: [{
          id: 'EPIC-001',
          title: 'Test Epic',
          cards: []
        }]
      };
      
      const result = serializer.serialize(boardData);
      expect(result).toContain('## Epic: Test Epic (EPIC-001)');
    });

    it('should serialize multiple epics', () => {
      const boardData: BoardData = {
        epics: [
          { id: 'EPIC-001', title: 'First Epic', cards: [] },
          { id: 'EPIC-002', title: 'Second Epic', cards: [] }
        ]
      };
      
      const result = serializer.serialize(boardData);
      expect(result).toContain('## Epic: First Epic (EPIC-001)');
      expect(result).toContain('## Epic: Second Epic (EPIC-002)');
    });
  });

  describe('card serialization', () => {
    it('should serialize basic card', () => {
      const card: Card = {
        id: 'CARD-001',
        title: 'Test Card',
        acceptanceCriteria: [],
        technicalTasks: []
      };
      
      const boardData: BoardData = {
        epics: [{
          id: 'EPIC-001',
          title: 'Test Epic',
          cards: [card]
        }]
      };
      
      const result = serializer.serialize(boardData);
      expect(result).toContain('### CARD-001: Test Card');
    });

    it('should serialize card metadata', () => {
      const card: Card = {
        id: 'CARD-001',
        title: 'Test Card',
        type: 'Story',
        priority: 'High',
        storyPoints: 5,
        sprint: 'Sprint 1',
        acceptanceCriteria: [],
        technicalTasks: []
      };
      
      const boardData: BoardData = {
        epics: [{
          id: 'EPIC-001',
          title: 'Test Epic',
          cards: [card]
        }]
      };
      
      const result = serializer.serialize(boardData);
      expect(result).toContain('**Type**: Story');
      expect(result).toContain('**Priority**: High');
      expect(result).toContain('**Story Points**: 5');
      expect(result).toContain('**Sprint**: Sprint 1');
    });

    it('should serialize card description', () => {
      const card: Card = {
        id: 'CARD-001',
        title: 'Test Card',
        description: 'This is a test card description.',
        acceptanceCriteria: [],
        technicalTasks: []
      };
      
      const boardData: BoardData = {
        epics: [{
          id: 'EPIC-001',
          title: 'Test Epic',
          cards: [card]
        }]
      };
      
      const result = serializer.serialize(boardData);
      expect(result).toContain('**Description**: This is a test card description.');
    });

    it('should serialize dependencies and blocks', () => {
      const card: Card = {
        id: 'CARD-001',
        title: 'Test Card',
        dependencies: ['CARD-002', 'CARD-003'],
        blocks: ['CARD-004'],
        acceptanceCriteria: [],
        technicalTasks: []
      };
      
      const boardData: BoardData = {
        epics: [{
          id: 'EPIC-001',
          title: 'Test Epic',
          cards: [card]
        }]
      };
      
      const result = serializer.serialize(boardData);
      expect(result).toContain('**Dependencies**: CARD-002, CARD-003');
      expect(result).toContain('**Blocks**: CARD-004');
    });

    it('should serialize empty dependencies and blocks as "None"', () => {
      const card: Card = {
        id: 'CARD-001',
        title: 'Test Card',
        dependencies: [],
        blocks: [],
        acceptanceCriteria: [],
        technicalTasks: []
      };
      
      const boardData: BoardData = {
        epics: [{
          id: 'EPIC-001',
          title: 'Test Epic',
          cards: [card]
        }]
      };
      
      const result = serializer.serialize(boardData);
      expect(result).toContain('**Dependencies**: None');
      expect(result).toContain('**Blocks**: None');
    });
  });

  describe('checklist serialization', () => {
    it('should serialize acceptance criteria', () => {
      const card: Card = {
        id: 'CARD-001',
        title: 'Test Card',
        acceptanceCriteria: [
          { text: 'First criterion', completed: false },
          { text: 'Second criterion', completed: true },
          { text: 'Third criterion', completed: false }
        ],
        technicalTasks: []
      };
      
      const boardData: BoardData = {
        epics: [{
          id: 'EPIC-001',
          title: 'Test Epic',
          cards: [card]
        }]
      };
      
      const result = serializer.serialize(boardData);
      expect(result).toContain('**Acceptance Criteria**:');
      expect(result).toContain('- [ ] First criterion');
      expect(result).toContain('- [x] Second criterion');
      expect(result).toContain('- [ ] Third criterion');
    });

    it('should serialize technical tasks', () => {
      const card: Card = {
        id: 'CARD-001',
        title: 'Test Card',
        acceptanceCriteria: [],
        technicalTasks: [
          { text: 'Task one', completed: false },
          { text: 'Task two', completed: true }
        ]
      };
      
      const boardData: BoardData = {
        epics: [{
          id: 'EPIC-001',
          title: 'Test Epic',
          cards: [card]
        }]
      };
      
      const result = serializer.serialize(boardData);
      expect(result).toContain('**Technical Tasks**:');
      expect(result).toContain('- [ ] Task one');
      expect(result).toContain('- [x] Task two');
    });
  });

  describe('serialization options', () => {
    it('should include empty fields when includeEmptyFields is true', () => {
      const serializer = new MarkdownSerializer({ includeEmptyFields: true });
      
      const card: Card = {
        id: 'CARD-001',
        title: 'Test Card',
        acceptanceCriteria: [],
        technicalTasks: []
      };
      
      const boardData: BoardData = {
        epics: [{
          id: 'EPIC-001',
          title: 'Test Epic',
          cards: [card]
        }]
      };
      
      const result = serializer.serialize(boardData);
      expect(result).toContain('**Type**: ');
      expect(result).toContain('**Priority**: ');
      expect(result).toContain('**Story Points**: ');
      expect(result).toContain('**Sprint**: ');
    });

    it('should not separate cards with HR when separateCardsWithHr is false', () => {
      const serializer = new MarkdownSerializer({ separateCardsWithHr: false });
      
      const boardData: BoardData = {
        epics: [{
          id: 'EPIC-001',
          title: 'Test Epic',
          cards: [
            { id: 'CARD-001', title: 'First Card', acceptanceCriteria: [], technicalTasks: [] },
            { id: 'CARD-002', title: 'Second Card', acceptanceCriteria: [], technicalTasks: [] }
          ]
        }]
      };
      
      const result = serializer.serialize(boardData);
      expect(result).not.toContain('---');
    });
  });

  describe('round-trip consistency', () => {
    it('should maintain data integrity in round-trip conversion', () => {
      const originalData: BoardData = {
        title: 'Test Board',
        epics: [{
          id: 'EPIC-001',
          title: 'Test Epic',
          cards: [{
            id: 'CARD-001',
            title: 'Test Card',
            type: 'Story',
            priority: 'High',
            storyPoints: 5,
            sprint: 'Sprint 1',
            description: 'Test description',
            acceptanceCriteria: [
              { text: 'First criterion', completed: false },
              { text: 'Second criterion', completed: true }
            ],
            technicalTasks: [
              { text: 'Task one', completed: false }
            ],
            dependencies: ['CARD-002'],
            blocks: ['CARD-003']
          }]
        }]
      };
      
      const markdown = serializer.serialize(originalData);
      
      // Basic checks to ensure the important data is preserved
      expect(markdown).toContain('# Test Board');
      expect(markdown).toContain('## Epic: Test Epic (EPIC-001)');
      expect(markdown).toContain('### CARD-001: Test Card');
      expect(markdown).toContain('**Type**: Story');
      expect(markdown).toContain('**Priority**: High');
      expect(markdown).toContain('**Story Points**: 5');
      expect(markdown).toContain('**Sprint**: Sprint 1');
      expect(markdown).toContain('**Description**: Test description');
      expect(markdown).toContain('**Acceptance Criteria**:');
      expect(markdown).toContain('- [ ] First criterion');
      expect(markdown).toContain('- [x] Second criterion');
      expect(markdown).toContain('**Technical Tasks**:');
      expect(markdown).toContain('- [ ] Task one');
      expect(markdown).toContain('**Dependencies**: CARD-002');
      expect(markdown).toContain('**Blocks**: CARD-003');
    });
  });
});