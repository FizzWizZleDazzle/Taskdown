import { useLocalStorage, loadFromLocalStorage, saveToLocalStorage, clearFromLocalStorage } from '../hooks/useLocalStorage';
import { render, act } from '@testing-library/react';
import React from 'react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component for hook testing
function TestComponent({ storageKey, initialValue }: { storageKey: string; initialValue: any }) {
  const [value, setValue] = useLocalStorage(storageKey, initialValue);
  
  return (
    <div>
      <span data-testid="value">{JSON.stringify(value)}</span>
      <button data-testid="set-value" onClick={() => setValue('new-value')}>
        Set Value
      </button>
      <button data-testid="set-function" onClick={() => setValue((prev: any) => prev + '-updated')}>
        Set Function
      </button>
    </div>
  );
}

describe('useLocalStorage hook', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should return initial value when localStorage is empty', () => {
    const { getByTestId } = render(
      <TestComponent storageKey="test-key" initialValue="initial-value" />
    );
    
    expect(getByTestId('value').textContent).toBe('"initial-value"');
  });

  it('should return stored value from localStorage', () => {
    localStorageMock.setItem('test-key', JSON.stringify('stored-value'));
    
    const { getByTestId } = render(
      <TestComponent storageKey="test-key" initialValue="initial-value" />
    );
    
    expect(getByTestId('value').textContent).toBe('"stored-value"');
  });

  it('should update localStorage when setValue is called', async () => {
    const { getByTestId } = render(
      <TestComponent storageKey="test-key" initialValue="initial-value" />
    );
    
    act(() => {
      getByTestId('set-value').click();
    });
    
    expect(getByTestId('value').textContent).toBe('"new-value"');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'));
  });

  it('should handle functional updates', () => {
    const { getByTestId } = render(
      <TestComponent storageKey="test-key" initialValue="initial-value" />
    );
    
    act(() => {
      getByTestId('set-function').click();
    });
    
    expect(getByTestId('value').textContent).toBe('"initial-value-updated"');
  });

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage.setItem to throw an error
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('Storage quota exceeded');
    });
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const { getByTestId } = render(
      <TestComponent storageKey="test-key" initialValue="initial-value" />
    );
    
    act(() => {
      getByTestId('set-value').click();
    });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error setting localStorage key "test-key":',
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });

  it('should handle invalid JSON in localStorage', () => {
    localStorageMock.getItem.mockReturnValueOnce('invalid-json{');
    
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    const { getByTestId } = render(
      <TestComponent storageKey="test-key" initialValue="fallback-value" />
    );
    
    expect(getByTestId('value').textContent).toBe('"fallback-value"');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error reading localStorage key "test-key":',
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });
});

describe('localStorage utility functions', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('loadFromLocalStorage', () => {
    it('should load and parse data from localStorage', () => {
      const testData = { tasks: [{ id: '1', title: 'Test Task' }] };
      localStorageMock.setItem('test-data', JSON.stringify(testData));
      
      const result = loadFromLocalStorage('test-data', { tasks: [] });
      
      expect(result).toEqual(testData);
    });

    it('should return fallback when key does not exist', () => {
      const fallback = { tasks: [] };
      const result = loadFromLocalStorage('non-existent-key', fallback);
      
      expect(result).toEqual(fallback);
    });

    it('should handle parsing errors gracefully', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid-json{');
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const fallback = { tasks: [] };
      
      const result = loadFromLocalStorage('test-key', fallback);
      
      expect(result).toEqual(fallback);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('saveToLocalStorage', () => {
    it('should save data to localStorage', () => {
      const testData = { tasks: [{ id: '1', title: 'Test Task' }] };
      
      saveToLocalStorage('test-data', testData);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-data', JSON.stringify(testData));
    });

    it('should handle save errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      saveToLocalStorage('test-data', { tasks: [] });
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('clearFromLocalStorage', () => {
    it('should remove data from localStorage', () => {
      clearFromLocalStorage('test-key');
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should handle removal errors gracefully', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Error removing item');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      clearFromLocalStorage('test-key');
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});