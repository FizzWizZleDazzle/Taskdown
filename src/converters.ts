import { Task, BoardData, Epic, Card, ChecklistItem } from './types';

/**
 * Convert Task array to BoardData format for serialization
 */
export function tasksToBoard(tasks: Task[], title?: string): BoardData {
  const epicMap = new Map<string, Epic>();
  
  // Group tasks by epic
  tasks.forEach(task => {
    const epicKey = task.epic || 'No Epic';
    const epicId = extractEpicId(epicKey);
    
    if (!epicMap.has(epicKey)) {
      epicMap.set(epicKey, {
        id: epicId,
        title: getEpicTitle(epicKey),
        cards: []
      });
    }
    
    const epic = epicMap.get(epicKey)!;
    epic.cards.push(taskToCard(task));
  });
  
  return {
    title,
    epics: Array.from(epicMap.values())
  };
}

/**
 * Convert BoardData to Task array format for the app
 */
export function boardToTasks(boardData: BoardData): Task[] {
  const tasks: Task[] = [];
  
  boardData.epics.forEach(epic => {
    epic.cards.forEach(card => {
      tasks.push(cardToTask(card, epic));
    });
  });
  
  return tasks;
}

/**
 * Convert a Task to Card format
 */
function taskToCard(task: Task): Card {
  return {
    id: task.id,
    title: task.title,
    type: task.type,
    priority: task.priority,
    storyPoints: task.storyPoints,
    sprint: task.sprint,
    description: task.description,
    acceptanceCriteria: task.acceptanceCriteria.map(item => ({
      text: item.text,
      completed: item.completed
    })),
    technicalTasks: task.technicalTasks.map(item => ({
      text: item.text,
      completed: item.completed
    })),
    dependencies: task.dependencies.length > 0 ? task.dependencies : undefined,
    blocks: task.blocks.length > 0 ? task.blocks : undefined
  };
}

/**
 * Convert a Card to Task format
 */
function cardToTask(card: Card, epic: Epic): Task {
  const now = new Date();
  
  return {
    id: card.id,
    title: card.title,
    type: (card.type as any) || 'Task',
    priority: (card.priority as any) || 'Medium',
    status: 'Todo', // Default status for imported tasks
    storyPoints: card.storyPoints,
    sprint: card.sprint,
    epic: `${epic.title} (${epic.id})`,
    description: card.description || '',
    acceptanceCriteria: card.acceptanceCriteria.map((item, index) => ({
      id: `ac${index + 1}`,
      text: item.text,
      completed: item.completed
    })),
    technicalTasks: card.technicalTasks.map((item, index) => ({
      id: `tt${index + 1}`,
      text: item.text,
      completed: item.completed
    })),
    dependencies: card.dependencies || [],
    blocks: card.blocks || [],
    assignee: undefined,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Extract epic ID from epic string like "Epic Name (ID)"
 */
function extractEpicId(epicString: string): string {
  const match = epicString.match(/\(([^)]+)\)$/);
  return match ? match[1] : epicString.replace(/\s+/g, '-').toUpperCase();
}

/**
 * Get epic title from epic string, removing the ID part
 */
function getEpicTitle(epicString: string): string {
  const match = epicString.match(/^(.+)\s+\([^)]+\)$/);
  return match ? match[1].trim() : epicString;
}