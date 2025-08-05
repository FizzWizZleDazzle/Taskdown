import React from 'react';
import { Task, SearchAndFilterState, defaultSearchAndFilterState } from '../types';
import { hasActiveSearchOrFilter } from '../filterUtils';
import './SearchAndFilter.css';

interface SearchAndFilterProps {
  tasks: Task[];
  searchAndFilter: SearchAndFilterState;
  onSearchAndFilterChange: (state: SearchAndFilterState) => void;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  tasks,
  searchAndFilter,
  onSearchAndFilterChange
}) => {
  // Extract unique values for filter dropdowns
  const uniqueEpics = Array.from(new Set(tasks.map(task => task.epic).filter(Boolean))).sort();
  const uniqueSprints = Array.from(new Set(tasks.map(task => task.sprint).filter(Boolean))).sort();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchAndFilterChange({
      ...searchAndFilter,
      searchText: e.target.value
    });
  };

  const handleFilterChange = (field: keyof SearchAndFilterState, value: string) => {
    onSearchAndFilterChange({
      ...searchAndFilter,
      [field]: value
    });
  };

  const clearAllFilters = () => {
    onSearchAndFilterChange(defaultSearchAndFilterState);
  };

  const hasActiveFilters = hasActiveSearchOrFilter(searchAndFilter);

  return (
    <div className="search-and-filter">
      <div className="search-section">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by title or description..."
            value={searchAndFilter.searchText}
            onChange={handleSearchChange}
            className="search-input"
            aria-label="Search tasks by title or description"
          />
          {searchAndFilter.searchText && (
            <button
              className="clear-search-btn"
              onClick={() => handleFilterChange('searchText', '')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-group">
          <label htmlFor="priority-filter" className="filter-label">Priority:</label>
          <select
            id="priority-filter"
            value={searchAndFilter.filterPriority}
            onChange={(e) => handleFilterChange('filterPriority', e.target.value)}
            className="filter-select"
            aria-label="Filter by priority"
          >
            <option value="All">All</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="type-filter" className="filter-label">Type:</label>
          <select
            id="type-filter"
            value={searchAndFilter.filterType}
            onChange={(e) => handleFilterChange('filterType', e.target.value)}
            className="filter-select"
            aria-label="Filter by type"
          >
            <option value="All">All</option>
            <option value="Epic">Epic</option>
            <option value="Story">Story</option>
            <option value="Task">Task</option>
            <option value="Bug">Bug</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status-filter" className="filter-label">Status:</label>
          <select
            id="status-filter"
            value={searchAndFilter.filterStatus}
            onChange={(e) => handleFilterChange('filterStatus', e.target.value)}
            className="filter-select"
            aria-label="Filter by status"
          >
            <option value="All">All</option>
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Done">Done</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="epic-filter" className="filter-label">Epic:</label>
          <select
            id="epic-filter"
            value={searchAndFilter.filterEpic}
            onChange={(e) => handleFilterChange('filterEpic', e.target.value)}
            className="filter-select"
            aria-label="Filter by epic"
          >
            <option value="All">All</option>
            {uniqueEpics.map(epic => (
              <option key={epic} value={epic}>{epic}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sprint-filter" className="filter-label">Sprint:</label>
          <select
            id="sprint-filter"
            value={searchAndFilter.filterSprint}
            onChange={(e) => handleFilterChange('filterSprint', e.target.value)}
            className="filter-select"
            aria-label="Filter by sprint"
          >
            <option value="All">All</option>
            {uniqueSprints.map(sprint => (
              <option key={sprint} value={sprint}>{sprint}</option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            className="clear-filters-btn"
            onClick={clearAllFilters}
            aria-label="Clear all filters"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchAndFilter;