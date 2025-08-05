import { MarkdownParser } from '../parser';
import { BoardData, Epic, Card } from '../types';

describe('MarkdownParser', () => {
  let parser: MarkdownParser;

  beforeEach(() => {
    parser = new MarkdownParser();
  });

  describe('basic parsing', () => {
    it('should parse board title', () => {
      const markdown = '# My Board Title';
      const result = parser.parse(markdown);
      
      expect(result.title).toBe('My Board Title');
      expect(result.epics).toHaveLength(0);
    });

    it('should parse single epic', () => {
      const markdown = `
# Board Title
## Epic: Test Epic (EPIC-001)
      `;
      const result = parser.parse(markdown);
      
      expect(result.epics).toHaveLength(1);
      expect(result.epics[0].id).toBe('EPIC-001');
      expect(result.epics[0].title).toBe('Test Epic');
      expect(result.epics[0].cards).toHaveLength(0);
    });

    it('should parse multiple epics', () => {
      const markdown = `
# Board Title
## Epic: First Epic (EPIC-001)
## Epic: Second Epic (EPIC-002)
      `;
      const result = parser.parse(markdown);
      
      expect(result.epics).toHaveLength(2);
      expect(result.epics[0].id).toBe('EPIC-001');
      expect(result.epics[1].id).toBe('EPIC-002');
    });
  });

  describe('card parsing', () => {
    it('should parse basic card', () => {
      const markdown = `
## Epic: Test Epic (EPIC-001)
### CARD-001: Test Card
      `;
      const result = parser.parse(markdown);
      
      expect(result.epics[0].cards).toHaveLength(1);
      expect(result.epics[0].cards[0].id).toBe('CARD-001');
      expect(result.epics[0].cards[0].title).toBe('Test Card');
    });

    it('should parse card metadata', () => {
      const markdown = `
## Epic: Test Epic (EPIC-001)
### CARD-001: Test Card

**Type**: Story  
**Priority**: High  
**Story Points**: 5  
**Sprint**: Sprint 1  
      `;
      const result = parser.parse(markdown);
      const card = result.epics[0].cards[0];
      
      expect(card.type).toBe('Story');
      expect(card.priority).toBe('High');
      expect(card.storyPoints).toBe(5);
      expect(card.sprint).toBe('Sprint 1');
    });

    it('should parse card description', () => {
      const markdown = `
## Epic: Test Epic (EPIC-001)
### CARD-001: Test Card

**Description**: This is a test card description.
      `;
      const result = parser.parse(markdown);
      const card = result.epics[0].cards[0];
      
      expect(card.description).toBe('This is a test card description.');
    });

    it('should parse dependencies and blocks', () => {
      const markdown = `
## Epic: Test Epic (EPIC-001)
### CARD-001: Test Card

**Dependencies**: CARD-002, CARD-003  
**Blocks**: CARD-004
      `;
      const result = parser.parse(markdown);
      const card = result.epics[0].cards[0];
      
      expect(card.dependencies).toEqual(['CARD-002', 'CARD-003']);
      expect(card.blocks).toEqual(['CARD-004']);
    });

    it('should handle "None" dependencies and blocks', () => {
      const markdown = `
## Epic: Test Epic (EPIC-001)
### CARD-001: Test Card

**Dependencies**: None  
**Blocks**: None
      `;
      const result = parser.parse(markdown);
      const card = result.epics[0].cards[0];
      
      expect(card.dependencies).toEqual([]);
      expect(card.blocks).toEqual([]);
    });
  });

  describe('checklist parsing', () => {
    it('should parse acceptance criteria', () => {
      const markdown = `
## Epic: Test Epic (EPIC-001)
### CARD-001: Test Card

**Acceptance Criteria**:

- [ ] First criterion
- [x] Second criterion (completed)
- [ ] Third criterion
      `;
      const result = parser.parse(markdown);
      const card = result.epics[0].cards[0];
      
      expect(card.acceptanceCriteria).toHaveLength(3);
      expect(card.acceptanceCriteria[0]).toEqual({
        text: 'First criterion',
        completed: false
      });
      expect(card.acceptanceCriteria[1]).toEqual({
        text: 'Second criterion (completed)',
        completed: true
      });
      expect(card.acceptanceCriteria[2]).toEqual({
        text: 'Third criterion',
        completed: false
      });
    });

    it('should parse technical tasks', () => {
      const markdown = `
## Epic: Test Epic (EPIC-001)
### CARD-001: Test Card

**Technical Tasks**:

- [ ] Task one
- [x] Task two (done)
      `;
      const result = parser.parse(markdown);
      const card = result.epics[0].cards[0];
      
      expect(card.technicalTasks).toHaveLength(2);
      expect(card.technicalTasks[0]).toEqual({
        text: 'Task one',
        completed: false
      });
      expect(card.technicalTasks[1]).toEqual({
        text: 'Task two (done)',
        completed: true
      });
    });
  });

  describe('complex parsing', () => {
    it('should parse the example.md format', () => {
      const markdown = `
# Jira Cards - Bevy Editor & Launcher

## Epic: Launcher Core Functionality (LAUNCH-001)

### LAUNCH-101: Project Management System

**Type**: Story  
**Priority**: Critical  
**Story Points**: 8  
**Sprint**: 1-2  

**Description**: As a developer, I want to manage my Bevy projects through the launcher so that I can easily create, import, and organize my game projects.

**Acceptance Criteria**:

- [ ] Can create new projects with configurable settings
- [ ] Can import existing Bevy projects by folder selection
- [x] Projects display with thumbnails in a grid/list view

**Technical Tasks**:

- [ ] Design project metadata schema
- [x] Implement SQLite database for project storage

**Dependencies**: None  
**Blocks**: LAUNCH-201, LAUNCH-301

---

### LAUNCH-102: Editor Version Management

**Type**: Story  
**Priority**: Critical  
**Story Points**: 5  
**Sprint**: 1-2  

**Description**: As a developer, I want to manage multiple Bevy Editor versions so that I can use different versions for different projects.

**Dependencies**: None  
**Blocks**: LAUNCH-103
      `;

      const result = parser.parse(markdown);
      
      expect(result.title).toBe('Jira Cards - Bevy Editor & Launcher');
      expect(result.epics).toHaveLength(1);
      
      const epic = result.epics[0];
      expect(epic.id).toBe('LAUNCH-001');
      expect(epic.title).toBe('Launcher Core Functionality');
      expect(epic.cards).toHaveLength(2);
      
      const card1 = epic.cards[0];
      expect(card1.id).toBe('LAUNCH-101');
      expect(card1.title).toBe('Project Management System');
      expect(card1.type).toBe('Story');
      expect(card1.priority).toBe('Critical');
      expect(card1.storyPoints).toBe(8);
      expect(card1.sprint).toBe('1-2');
      expect(card1.acceptanceCriteria).toHaveLength(3);
      expect(card1.technicalTasks).toHaveLength(2);
      expect(card1.dependencies).toEqual([]);
      expect(card1.blocks).toEqual(['LAUNCH-201', 'LAUNCH-301']);
      
      const card2 = epic.cards[1];
      expect(card2.id).toBe('LAUNCH-102');
      expect(card2.title).toBe('Editor Version Management');
      expect(card2.blocks).toEqual(['LAUNCH-103']);
    });
  });
});