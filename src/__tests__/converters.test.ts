import { tasksToBoard, boardToTasks } from '../converters';
import { Task, BoardData } from '../types';

describe('Converters', () => {
  const sampleTask: Task = {
    id: 'TEST-001',
    title: 'Test Task',
    type: 'Story',
    priority: 'High',
    status: 'Todo',
    storyPoints: 5,
    sprint: 'Sprint 1',
    epic: 'Test Epic (EPIC-001)',
    description: 'A test task description',
    acceptanceCriteria: [
      { id: 'ac1', text: 'Criteria 1', completed: false },
      { id: 'ac2', text: 'Criteria 2', completed: true }
    ],
    technicalTasks: [
      { id: 'tt1', text: 'Task 1', completed: true }
    ],
    dependencies: ['DEP-001'],
    blocks: ['BLOCK-001'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const sampleBoardData: BoardData = {
    title: 'Test Board',
    epics: [
      {
        id: 'EPIC-001',
        title: 'Test Epic',
        cards: [
          {
            id: 'TEST-001',
            title: 'Test Task',
            type: 'Story',
            priority: 'High',
            storyPoints: 5,
            sprint: 'Sprint 1',
            description: 'A test task description',
            acceptanceCriteria: [
              { text: 'Criteria 1', completed: false },
              { text: 'Criteria 2', completed: true }
            ],
            technicalTasks: [
              { text: 'Task 1', completed: true }
            ],
            dependencies: ['DEP-001'],
            blocks: ['BLOCK-001']
          }
        ]
      }
    ]
  };

  describe('tasksToBoard', () => {
    it('should convert tasks to board data format', () => {
      const result = tasksToBoard([sampleTask], 'Test Board');
      
      expect(result.title).toBe('Test Board');
      expect(result.epics).toHaveLength(1);
      
      const epic = result.epics[0];
      expect(epic.id).toBe('EPIC-001');
      expect(epic.title).toBe('Test Epic');
      expect(epic.cards).toHaveLength(1);
      
      const card = epic.cards[0];
      expect(card.id).toBe('TEST-001');
      expect(card.title).toBe('Test Task');
      expect(card.type).toBe('Story');
      expect(card.priority).toBe('High');
      expect(card.storyPoints).toBe(5);
      expect(card.sprint).toBe('Sprint 1');
      expect(card.description).toBe('A test task description');
      expect(card.acceptanceCriteria).toHaveLength(2);
      expect(card.technicalTasks).toHaveLength(1);
      expect(card.dependencies).toEqual(['DEP-001']);
      expect(card.blocks).toEqual(['BLOCK-001']);
    });

    it('should group tasks by epic', () => {
      const tasks = [
        { ...sampleTask, id: 'TEST-001', epic: 'Epic 1 (EPIC-001)' },
        { ...sampleTask, id: 'TEST-002', epic: 'Epic 2 (EPIC-002)' },
        { ...sampleTask, id: 'TEST-003', epic: 'Epic 1 (EPIC-001)' }
      ];
      
      const result = tasksToBoard(tasks);
      
      expect(result.epics).toHaveLength(2);
      expect(result.epics[0].cards).toHaveLength(2);
      expect(result.epics[1].cards).toHaveLength(1);
    });

    it('should handle tasks without epic', () => {
      const taskWithoutEpic = { ...sampleTask, epic: undefined };
      const result = tasksToBoard([taskWithoutEpic]);
      
      expect(result.epics).toHaveLength(1);
      expect(result.epics[0].id).toBe('NO-EPIC');
      expect(result.epics[0].title).toBe('No Epic');
    });
  });

  describe('boardToTasks', () => {
    it('should convert board data to tasks format', () => {
      const result = boardToTasks(sampleBoardData);
      
      expect(result).toHaveLength(1);
      
      const task = result[0];
      expect(task.id).toBe('TEST-001');
      expect(task.title).toBe('Test Task');
      expect(task.type).toBe('Story');
      expect(task.priority).toBe('High');
      expect(task.status).toBe('Todo'); // Default status
      expect(task.storyPoints).toBe(5);
      expect(task.sprint).toBe('Sprint 1');
      expect(task.epic).toBe('Test Epic (EPIC-001)');
      expect(task.description).toBe('A test task description');
      expect(task.acceptanceCriteria).toHaveLength(2);
      expect(task.technicalTasks).toHaveLength(1);
      expect(task.dependencies).toEqual(['DEP-001']);
      expect(task.blocks).toEqual(['BLOCK-001']);
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle multiple epics and cards', () => {
      const boardData: BoardData = {
        epics: [
          {
            id: 'EPIC-001',
            title: 'Epic 1',
            cards: [
              { ...sampleBoardData.epics[0].cards[0], id: 'CARD-001' },
              { ...sampleBoardData.epics[0].cards[0], id: 'CARD-002' }
            ]
          },
          {
            id: 'EPIC-002',
            title: 'Epic 2', 
            cards: [
              { ...sampleBoardData.epics[0].cards[0], id: 'CARD-003' }
            ]
          }
        ]
      };
      
      const result = boardToTasks(boardData);
      
      expect(result).toHaveLength(3);
      expect(result[0].epic).toBe('Epic 1 (EPIC-001)');
      expect(result[1].epic).toBe('Epic 1 (EPIC-001)');
      expect(result[2].epic).toBe('Epic 2 (EPIC-002)');
    });

    it('should provide default values for missing fields', () => {
      const minimalBoardData: BoardData = {
        epics: [
          {
            id: 'EPIC-001',
            title: 'Minimal Epic',
            cards: [
              {
                id: 'CARD-001',
                title: 'Minimal Card',
                acceptanceCriteria: [],
                technicalTasks: []
              }
            ]
          }
        ]
      };
      
      const result = boardToTasks(minimalBoardData);
      
      expect(result).toHaveLength(1);
      
      const task = result[0];
      expect(task.type).toBe('Task');
      expect(task.priority).toBe('Medium');
      expect(task.status).toBe('Todo');
      expect(task.description).toBe('');
      expect(task.dependencies).toEqual([]);
      expect(task.blocks).toEqual([]);
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve data through task->board->task conversion', () => {
      const originalTasks = [sampleTask];
      const boardData = tasksToBoard(originalTasks);
      const convertedTasks = boardToTasks(boardData);
      
      expect(convertedTasks).toHaveLength(1);
      
      const converted = convertedTasks[0];
      expect(converted.id).toBe(sampleTask.id);
      expect(converted.title).toBe(sampleTask.title);
      expect(converted.type).toBe(sampleTask.type);
      expect(converted.priority).toBe(sampleTask.priority);
      expect(converted.storyPoints).toBe(sampleTask.storyPoints);
      expect(converted.sprint).toBe(sampleTask.sprint);
      expect(converted.epic).toBe(sampleTask.epic);
      expect(converted.description).toBe(sampleTask.description);
      expect(converted.acceptanceCriteria.map(ac => ac.text)).toEqual(
        sampleTask.acceptanceCriteria.map(ac => ac.text)
      );
      expect(converted.technicalTasks.map(tt => tt.text)).toEqual(
        sampleTask.technicalTasks.map(tt => tt.text)
      );
      expect(converted.dependencies).toEqual(sampleTask.dependencies);
      expect(converted.blocks).toEqual(sampleTask.blocks);
    });
  });
});