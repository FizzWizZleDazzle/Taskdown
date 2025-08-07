import { MarkdownParser } from '../parser';

describe('MarkdownParser - Edge Cases', () => {
  let parser: MarkdownParser;

  beforeEach(() => {
    parser = new MarkdownParser();
  });

  describe('user reported issue format', () => {
    it('should parse the exact format from the user issue', () => {
      const markdown = `# Launcher Board

## Epic: Project Creation and Management (LAUNCH-EPIC-1)

### LAUNCH-001: Create New Project from Template
**Type**: Story  
**Priority**: Critical  
**Story Points**: 5  
**Sprint**: TBD  
**Description**: Enable users to create a new Bevy project from a template selection screen.

**Acceptance Criteria**:
- [ ] User can select from at least 3 templates (2D, 3D, Minimal)
- [ ] Project is created with proper Cargo.toml and folder structure
- [ ] Project appears in the launcher's project list immediately after creation
- [ ] Created project can be opened in the editor

**Technical Tasks**:
- [ ] Implement template selection UI
- [ ] Generate project structure from template
- [ ] Integrate with project list

**Dependencies**: None
**Blocks**: LAUNCH-002

---

### LAUNCH-002: Import Existing Project
**Type**: Story  
**Priority**: Critical  
**Story Points**: 3  
**Sprint**: TBD  
**Description**: Allow users to add their existing Bevy projects to the launcher.

**Acceptance Criteria**:
- [ ] User can browse and select a folder containing a Bevy project
- [ ] Launcher validates the project has a valid Cargo.toml
- [ ] Project is added to the project list with metadata
- [ ] Invalid projects show clear error message

**Technical Tasks**:
- [ ] Implement folder picker
- [ ] Validate Cargo.toml
- [ ] Add project to list

**Dependencies**: LAUNCH-001
**Blocks**: LAUNCH-003

---`;

      const result = parser.parse(markdown);
      
      expect(result.title).toBe('Launcher Board');
      expect(result.epics).toHaveLength(1);
      
      const epic = result.epics[0];
      expect(epic.id).toBe('LAUNCH-EPIC-1');
      expect(epic.title).toBe('Project Creation and Management');
      expect(epic.cards).toHaveLength(2);
      
      const card1 = epic.cards[0];
      expect(card1.id).toBe('LAUNCH-001');
      expect(card1.title).toBe('Create New Project from Template');
      expect(card1.type).toBe('Story');
      expect(card1.priority).toBe('Critical');
      expect(card1.storyPoints).toBe(5);
      expect(card1.sprint).toBe('TBD');
      expect(card1.description).toBe('Enable users to create a new Bevy project from a template selection screen.');
      expect(card1.acceptanceCriteria).toHaveLength(4);
      expect(card1.technicalTasks).toHaveLength(3);
      expect(card1.dependencies).toEqual([]);
      expect(card1.blocks).toEqual(['LAUNCH-002']);
      
      const card2 = epic.cards[1];
      expect(card2.id).toBe('LAUNCH-002');
      expect(card2.title).toBe('Import Existing Project');
      expect(card2.dependencies).toEqual(['LAUNCH-001']);
      expect(card2.blocks).toEqual(['LAUNCH-003']);
    });

    it('should handle edge cases that might cause parsing errors', () => {
      // Test various edge cases that might cause issues
      
      // Case 1: Missing epic parentheses
      expect(() => {
        parser.parse('# Board\n## Epic: Test Epic without ID');
      }).not.toThrow();
      
      // Case 2: Empty sections
      expect(() => {
        parser.parse(`# Board
## Epic: Test (TEST-1)
### CARD-1: Test Card
**Type**: Story
**Acceptance Criteria**:
**Technical Tasks**:`);
      }).not.toThrow();
      
      // Case 3: Malformed metadata
      expect(() => {
        parser.parse(`# Board
## Epic: Test (TEST-1)
### CARD-1: Test Card
**Type**: 
**Priority**: 
**Story Points**: invalid`);
      }).not.toThrow();
      
      // Case 4: Missing card sections
      expect(() => {
        parser.parse(`# Board
## Epic: Test (TEST-1)
### CARD-1: Test Card`);
      }).not.toThrow();
    });
  });
});