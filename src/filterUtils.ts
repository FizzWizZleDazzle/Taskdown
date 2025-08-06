import { Task, SearchAndFilterState } from './types';

/**
 * Applies search and filter criteria to a list of tasks
 */
export function filterTasks(tasks: Task[], searchAndFilter: SearchAndFilterState): Task[] {
  return tasks.filter(task => {
    // Search filter (case-insensitive, searches title and description)
    if (searchAndFilter.searchText) {
      const searchLower = searchAndFilter.searchText.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(searchLower);
      const descriptionMatch = task.description.toLowerCase().includes(searchLower);
      
      if (!titleMatch && !descriptionMatch) {
        return false;
      }
    }

    // Priority filter
    if (searchAndFilter.filterPriority !== 'All' && task.priority !== searchAndFilter.filterPriority) {
      return false;
    }

    // Type filter
    if (searchAndFilter.filterType !== 'All' && task.type !== searchAndFilter.filterType) {
      return false;
    }

    // Status filter
    if (searchAndFilter.filterStatus !== 'All' && task.status !== searchAndFilter.filterStatus) {
      return false;
    }

    // Epic filter
    if (searchAndFilter.filterEpic !== 'All') {
      if (!task.epic) {
        return false;
      }
      if (task.epic !== searchAndFilter.filterEpic) {
        return false;
      }
    }

    // Sprint filter
    if (searchAndFilter.filterSprint !== 'All') {
      if (!task.sprint) {
        return false;
      }
      if (task.sprint !== searchAndFilter.filterSprint) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Checks if any search or filter criteria are active
 */
export function hasActiveSearchOrFilter(searchAndFilter: SearchAndFilterState): boolean {
  return searchAndFilter.searchText !== '' ||
    searchAndFilter.filterPriority !== 'All' ||
    searchAndFilter.filterType !== 'All' ||
    searchAndFilter.filterStatus !== 'All' ||
    searchAndFilter.filterEpic !== 'All' ||
    searchAndFilter.filterSprint !== 'All';
}

/**
 * Gets a summary of active filters for display
 */
export function getActiveFiltersSummary(searchAndFilter: SearchAndFilterState): string[] {
  const active: string[] = [];
  
  if (searchAndFilter.searchText) {
    active.push(`Search: "${searchAndFilter.searchText}"`);
  }
  
  if (searchAndFilter.filterPriority !== 'All') {
    active.push(`Priority: ${searchAndFilter.filterPriority}`);
  }
  
  if (searchAndFilter.filterType !== 'All') {
    active.push(`Type: ${searchAndFilter.filterType}`);
  }
  
  if (searchAndFilter.filterStatus !== 'All') {
    active.push(`Status: ${searchAndFilter.filterStatus}`);
  }
  
  if (searchAndFilter.filterEpic !== 'All') {
    active.push(`Epic: ${searchAndFilter.filterEpic}`);
  }
  
  if (searchAndFilter.filterSprint !== 'All') {
    active.push(`Sprint: ${searchAndFilter.filterSprint}`);
  }
  
  return active;
}