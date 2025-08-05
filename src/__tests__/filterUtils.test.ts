import { filterTasks, hasActiveSearchOrFilter, getActiveFiltersSummary } from '../filterUtils';
import { Task } from '../types';

// Import the types from SearchAndFilter without the CSS import issue
export interface SearchAndFilterState {
  searchText: string;
  filterPriority: 'Critical' | 'High' | 'Medium' | 'Low' | 'All';
  filterType: 'Epic' | 'Story' | 'Task' | 'Bug' | 'All';
  filterStatus: 'Todo' | 'In Progress' | 'In Review' | 'Done' | 'All';
  filterEpic: string | 'All';
  filterSprint: string | 'All';
}

export const defaultSearchAndFilterState: SearchAndFilterState = {
  searchText: '',
  filterPriority: 'All',
  filterType: 'All',
  filterStatus: 'All',
  filterEpic: 'All',
  filterSprint: 'All'
};

// Sample tasks for testing
const sampleTasks: Task[] = [
  {
    id: 'TASK-1',
    title: 'Project Management System',
    type: 'Story',
    priority: 'Critical',
    status: 'Todo',
    storyPoints: 8,
    sprint: '1-2',
    epic: 'Launcher Core Functionality (LAUNCH-001)',
    description: 'As a developer, I want to manage my Bevy projects through the launcher so that I can easily create, import, and organize my game projects.',
    acceptanceCriteria: [],
    technicalTasks: [],
    dependencies: [],
    blocks: ['TASK-2', 'TASK-3'],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    id: 'TASK-2',
    title: 'Editor Version Management',
    type: 'Story',
    priority: 'Critical',
    status: 'In Progress',
    storyPoints: 5,
    sprint: '1-2',
    epic: 'Launcher Core Functionality (LAUNCH-001)',
    description: 'As a developer, I want to manage multiple Bevy Editor versions so that I can use different versions for different projects.',
    acceptanceCriteria: [],
    technicalTasks: [],
    dependencies: [],
    blocks: ['TASK-3'],
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02')
  },
  {
    id: 'TASK-3',
    title: 'Project Template System',
    type: 'Story',
    priority: 'High',
    status: 'Done',
    storyPoints: 3,
    sprint: '1',
    epic: 'Launcher Core Functionality (LAUNCH-001)',
    description: 'As a developer, I want to create projects from templates so that I can quickly start with common project structures.',
    acceptanceCriteria: [],
    technicalTasks: [],
    dependencies: ['TASK-2'],
    blocks: [],
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-03')
  },
  {
    id: 'TASK-4',
    title: 'User Authentication',
    type: 'Bug',
    priority: 'Medium',
    status: 'In Review',
    storyPoints: 2,
    sprint: '2',
    epic: 'Security Features (SEC-001)',
    description: 'Fix authentication issues in the login system.',
    acceptanceCriteria: [],
    technicalTasks: [],
    dependencies: [],
    blocks: [],
    createdAt: new Date('2023-01-04'),
    updatedAt: new Date('2023-01-04')
  }
];

describe('filterTasks', () => {
  it('should return all tasks when no filters are applied', () => {
    const filtered = filterTasks(sampleTasks, defaultSearchAndFilterState);
    expect(filtered).toHaveLength(4);
    expect(filtered).toEqual(sampleTasks);
  });

  it('should filter by search text in title', () => {
    const searchState: SearchAndFilterState = {
      ...defaultSearchAndFilterState,
      searchText: 'Management'
    };
    const filtered = filterTasks(sampleTasks, searchState);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(t => t.id)).toEqual(['TASK-1', 'TASK-2']);
  });

  it('should filter by search text in description', () => {
    const searchState: SearchAndFilterState = {
      ...defaultSearchAndFilterState,
      searchText: 'authentication'
    };
    const filtered = filterTasks(sampleTasks, searchState);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('TASK-4');
  });

  it('should filter by priority', () => {
    const searchState: SearchAndFilterState = {
      ...defaultSearchAndFilterState,
      filterPriority: 'Critical'
    };
    const filtered = filterTasks(sampleTasks, searchState);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(t => t.id)).toEqual(['TASK-1', 'TASK-2']);
  });

  it('should filter by type', () => {
    const searchState: SearchAndFilterState = {
      ...defaultSearchAndFilterState,
      filterType: 'Bug'
    };
    const filtered = filterTasks(sampleTasks, searchState);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('TASK-4');
  });

  it('should filter by status', () => {
    const searchState: SearchAndFilterState = {
      ...defaultSearchAndFilterState,
      filterStatus: 'Done'
    };
    const filtered = filterTasks(sampleTasks, searchState);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('TASK-3');
  });

  it('should filter by epic', () => {
    const searchState: SearchAndFilterState = {
      ...defaultSearchAndFilterState,
      filterEpic: 'Security Features (SEC-001)'
    };
    const filtered = filterTasks(sampleTasks, searchState);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('TASK-4');
  });

  it('should filter by sprint', () => {
    const searchState: SearchAndFilterState = {
      ...defaultSearchAndFilterState,
      filterSprint: '1-2'
    };
    const filtered = filterTasks(sampleTasks, searchState);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(t => t.id)).toEqual(['TASK-1', 'TASK-2']);
  });

  it('should apply multiple filters at once', () => {
    const searchState: SearchAndFilterState = {
      ...defaultSearchAndFilterState,
      searchText: 'template',
      filterPriority: 'High',
      filterStatus: 'Done'
    };
    const filtered = filterTasks(sampleTasks, searchState);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('TASK-3');
  });

  it('should return empty array when no tasks match filters', () => {
    const searchState: SearchAndFilterState = {
      ...defaultSearchAndFilterState,
      filterType: 'Epic',
      filterStatus: 'Todo'
    };
    const filtered = filterTasks(sampleTasks, searchState);
    expect(filtered).toHaveLength(0);
  });

  it('should be case-insensitive for search text', () => {
    const searchState: SearchAndFilterState = {
      ...defaultSearchAndFilterState,
      searchText: 'MANAGEMENT'
    };
    const filtered = filterTasks(sampleTasks, searchState);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(t => t.id)).toEqual(['TASK-1', 'TASK-2']);
  });
});

describe('hasActiveSearchOrFilter', () => {
  it('should return false for default state', () => {
    expect(hasActiveSearchOrFilter(defaultSearchAndFilterState)).toBe(false);
  });

  it('should return true when search text is set', () => {
    const searchState: SearchAndFilterState = {
      ...defaultSearchAndFilterState,
      searchText: 'test'
    };
    expect(hasActiveSearchOrFilter(searchState)).toBe(true);
  });

  it('should return true when any filter is set', () => {
    const searchState: SearchAndFilterState = {
      ...defaultSearchAndFilterState,
      filterPriority: 'High'
    };
    expect(hasActiveSearchOrFilter(searchState)).toBe(true);
  });

  it('should return true when multiple filters are set', () => {
    const searchState: SearchAndFilterState = {
      ...defaultSearchAndFilterState,
      filterPriority: 'High',
      filterType: 'Story',
      searchText: 'test'
    };
    expect(hasActiveSearchOrFilter(searchState)).toBe(true);
  });
});

describe('getActiveFiltersSummary', () => {
  it('should return empty array for default state', () => {
    const summary = getActiveFiltersSummary(defaultSearchAndFilterState);
    expect(summary).toEqual([]);
  });

  it('should include search text in summary', () => {
    const searchState: SearchAndFilterState = {
      ...defaultSearchAndFilterState,
      searchText: 'project'
    };
    const summary = getActiveFiltersSummary(searchState);
    expect(summary).toContain('Search: "project"');
  });

  it('should include all active filters in summary', () => {
    const searchState: SearchAndFilterState = {
      ...defaultSearchAndFilterState,
      searchText: 'test',
      filterPriority: 'High',
      filterType: 'Story',
      filterStatus: 'Done'
    };
    const summary = getActiveFiltersSummary(searchState);
    expect(summary).toContain('Search: "test"');
    expect(summary).toContain('Priority: High');
    expect(summary).toContain('Type: Story');
    expect(summary).toContain('Status: Done');
    expect(summary).toHaveLength(4);
  });

  it('should not include filters set to "All"', () => {
    const searchState: SearchAndFilterState = {
      ...defaultSearchAndFilterState,
      filterPriority: 'High',
      filterType: 'All',
      filterStatus: 'All'
    };
    const summary = getActiveFiltersSummary(searchState);
    expect(summary).toEqual(['Priority: High']);
  });
});