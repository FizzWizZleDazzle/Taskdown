import { Task } from './types';

export const sampleTasks: Task[] = [
  {
    id: 'LAUNCH-101',
    title: 'Project Management System',
    type: 'Story',
    priority: 'Critical',
    status: 'Todo',
    storyPoints: 8,
    sprint: '1-2',
    epic: 'Launcher Core Functionality (LAUNCH-001)',
    description: 'As a developer, I want to manage my Bevy projects through the launcher so that I can easily create, import, and organize my game projects.',
    acceptanceCriteria: [
      { id: 'ac1', text: 'Can create new projects with configurable settings', completed: false },
      { id: 'ac2', text: 'Can import existing Bevy projects by folder selection', completed: false },
      { id: 'ac3', text: 'Projects display with thumbnails in a grid/list view', completed: false },
      { id: 'ac4', text: 'Can search projects by name, tags, or last modified date', completed: false },
      { id: 'ac5', text: 'Project metadata persists between launcher sessions', completed: false },
      { id: 'ac6', text: 'Can mark projects as favorites', completed: false },
      { id: 'ac7', text: 'Can delete projects (with confirmation)', completed: false }
    ],
    technicalTasks: [
      { id: 'tt1', text: 'Design project metadata schema', completed: false },
      { id: 'tt2', text: 'Implement SQLite database for project storage', completed: false },
      { id: 'tt3', text: 'Create thumbnail generation service', completed: false },
      { id: 'tt4', text: 'Build project scanning service', completed: false },
      { id: 'tt5', text: 'Implement search indexing', completed: false }
    ],
    dependencies: [],
    blocks: ['LAUNCH-201', 'LAUNCH-301'],
    isFavorite: true,
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzMzNzNkYyIvPgo8dGV4dCB4PSIyMCIgeT0iMjYiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlBNPC90ZXh0Pgo8L3N2Zz4K',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'LAUNCH-102',
    title: 'Editor Version Management',
    type: 'Story',
    priority: 'Critical',
    status: 'In Progress',
    storyPoints: 5,
    sprint: '1-2',
    epic: 'Launcher Core Functionality (LAUNCH-001)',
    description: 'As a developer, I want to manage multiple Bevy Editor versions so that I can use different versions for different projects.',
    acceptanceCriteria: [
      { id: 'ac8', text: 'Can view available editor versions from remote manifest', completed: true },
      { id: 'ac9', text: 'Can download and install editor versions with progress indicator', completed: true },
      { id: 'ac10', text: 'Can associate specific editor version with each project', completed: false },
      { id: 'ac11', text: 'Version compatibility warnings shown for mismatched versions', completed: false },
      { id: 'ac12', text: 'Can uninstall unused editor versions', completed: false },
      { id: 'ac13', text: 'Disk space usage shown per version', completed: false }
    ],
    technicalTasks: [
      { id: 'tt6', text: 'Create version manifest API client', completed: true },
      { id: 'tt7', text: 'Implement download manager with pause/resume', completed: true },
      { id: 'tt8', text: 'Build version isolation system', completed: false },
      { id: 'tt9', text: 'Create compatibility checker service', completed: false }
    ],
    dependencies: [],
    blocks: ['LAUNCH-103'],
    isFavorite: false,
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iI2ZiN2E4NSIvPgo8dGV4dCB4PSIyMCIgeT0iMjYiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVWPC90ZXh0Pgo8L3N2Zz4K',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'LAUNCH-103',
    title: 'Project Template System',
    type: 'Story',
    priority: 'High',
    status: 'Done',
    storyPoints: 3,
    sprint: '1',
    epic: 'Launcher Core Functionality (LAUNCH-001)',
    description: 'As a developer, I want to create projects from templates so that I can quickly start with common project structures.',
    acceptanceCriteria: [
      { id: 'ac14', text: 'Can browse available project templates', completed: true },
      { id: 'ac15', text: 'Can create project from template with custom name', completed: true },
      { id: 'ac16', text: 'Templates include basic Bevy setups', completed: true }
    ],
    technicalTasks: [
      { id: 'tt10', text: 'Create template registry', completed: true },
      { id: 'tt11', text: 'Implement template instantiation', completed: true }
    ],
    dependencies: ['LAUNCH-102'],
    blocks: [],
    isFavorite: false,
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzEwYjk4MSIvPgo8dGV4dCB4PSIyMCIgeT0iMjYiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlRTPC90ZXh0Pgo8L3N2Zz4K',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-20')
  }
];