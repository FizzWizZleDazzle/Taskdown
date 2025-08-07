import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Board from '../components/Board';
import { Task, Workspace } from '../types';
import { TASK_STATUSES } from '../constants';

// Mock the DnD components
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
  PointerSensor: jest.fn(),
  DragOverlay: ({ children }: any) => <div data-testid="drag-overlay">{children}</div>,
  useDroppable: jest.fn(() => ({
    isOver: false,
    setNodeRef: jest.fn(),
  })),
  closestCenter: jest.fn(),
}));

describe('Board - File Import Validation', () => {
  const mockTasks: Task[] = [];
  const mockWorkspace: Workspace = {
    id: 'test',
    name: 'Test Workspace',
    type: 'local',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const defaultProps = {
    tasks: mockTasks,
    onTaskUpdate: jest.fn(),
    onTaskCreate: jest.fn(),
    onTaskDelete: jest.fn(),
    onFileImport: jest.fn(),
    onExport: jest.fn(),
    currentWorkspace: mockWorkspace
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should accept markdown files with .md extension', async () => {
    const { container } = render(<Board {...defaultProps} />);
    
    // Create a file with .md extension
    const file = new File(['# Test'], 'test.md', { type: 'text/plain' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(defaultProps.onFileImport).toHaveBeenCalledWith(file);
    });
  });

  it('should accept markdown files with .markdown extension', async () => {
    const { container } = render(<Board {...defaultProps} />);
    
    // Create a file with .markdown extension
    const file = new File(['# Test'], 'test.markdown', { type: 'text/plain' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(defaultProps.onFileImport).toHaveBeenCalledWith(file);
    });
  });

  it('should accept files with text/markdown MIME type', async () => {
    const { container } = render(<Board {...defaultProps} />);
    
    // Create a file with proper MIME type
    const file = new File(['# Test'], 'test.md', { type: 'text/markdown' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(defaultProps.onFileImport).toHaveBeenCalledWith(file);
    });
  });

  it('should reject files without markdown extension or MIME type', async () => {
    // Mock window.alert
    const originalAlert = window.alert;
    window.alert = jest.fn();

    const { container } = render(<Board {...defaultProps} />);
    
    // Create a file that's not markdown
    const file = new File(['Some text'], 'test.txt', { type: 'text/plain' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Please select a valid Markdown (.md) file.');
      expect(defaultProps.onFileImport).not.toHaveBeenCalled();
    });

    window.alert = originalAlert;
  });

  it('should handle drag and drop of markdown files', async () => {
    const { container } = render(<Board {...defaultProps} />);
    
    const file = new File(['# Test'], 'test.md', { type: 'text/plain' });
    const boardElement = container.querySelector('.board-columns') as HTMLElement;
    
    // Mock the drop event
    const dropEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        files: [file]
      }
    } as any;
    
    fireEvent.drop(boardElement, dropEvent);
    
    await waitFor(() => {
      expect(defaultProps.onFileImport).toHaveBeenCalledWith(file);
    });
  });
});