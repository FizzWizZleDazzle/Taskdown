import React, { useState } from 'react';
import { ChecklistItem } from '../types';
import './Checklist.css';

interface ChecklistProps {
  title: string;
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

const Checklist: React.FC<ChecklistProps> = ({ title, items, onChange }) => {
  const [newItemText, setNewItemText] = useState('');

  const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const handleAddItem = () => {
    if (newItemText.trim()) {
      const newItem: ChecklistItem = {
        id: generateId(),
        text: newItemText.trim(),
        completed: false
      };
      onChange([...items, newItem]);
      setNewItemText('');
    }
  };

  const handleToggleItem = (id: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    onChange(updatedItems);
  };

  const handleUpdateItem = (id: string, text: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, text } : item
    );
    onChange(updatedItems);
  };

  const handleDeleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    onChange(updatedItems);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  const completedCount = items.filter(item => item.completed).length;
  const progressPercentage = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="checklist">
      <div className="checklist-header">
        <h4>{title}</h4>
        <div className="checklist-progress">
          <span className="progress-text">
            {completedCount}/{items.length} ({progressPercentage}%)
          </span>
          <div className="progress-bar-small">
            <div 
              className="progress-fill-small" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="checklist-items">
        {items.map((item) => (
          <ChecklistItemComponent
            key={item.id}
            item={item}
            onToggle={handleToggleItem}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
          />
        ))}
      </div>

      <div className="add-item-section">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Add new ${title.toLowerCase()} item...`}
          className="add-item-input"
        />
        <button 
          type="button" 
          onClick={handleAddItem}
          className="add-item-btn"
          disabled={!newItemText.trim()}
        >
          Add
        </button>
      </div>
    </div>
  );
};

interface ChecklistItemComponentProps {
  item: ChecklistItem;
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

const ChecklistItemComponent: React.FC<ChecklistItemComponentProps> = ({
  item,
  onToggle,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(item.id, editText.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(item.text);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className={`checklist-item ${item.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={item.completed}
        onChange={() => onToggle(item.id)}
        className="checklist-checkbox"
      />
      
      {isEditing ? (
        <div className="edit-section">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyPress={handleKeyPress}
            onBlur={handleSave}
            autoFocus
            className="edit-input"
          />
        </div>
      ) : (
        <div className="item-content" onDoubleClick={() => setIsEditing(true)}>
          <span className="item-text">{item.text}</span>
          <div className="item-actions">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="edit-btn"
              title="Edit item"
            >
              ✏️
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="delete-btn"
              title="Delete item"
            >
              🗑️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Checklist);