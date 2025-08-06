import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './CustomDropdown.css';

interface Option {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  
  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const dropdownOptions = isOpen ? (
    <ul 
      className="custom-dropdown-options custom-dropdown-portal" 
      role="listbox"
      style={{
        position: 'fixed',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 999999
      }}
    >
      {options.map((option) => (
        <li
          key={option.value}
          className={`dropdown-option ${option.value === value ? 'selected' : ''}`}
          onClick={() => handleSelect(option.value)}
          role="option"
          aria-selected={option.value === value}
        >
          {option.label}
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <>
      <div 
        ref={dropdownRef} 
        className={`custom-dropdown ${className} ${isOpen ? 'open' : ''}`}
        id={id}
      >
        <button
          ref={triggerRef}
          type="button"
          className="custom-dropdown-trigger"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="dropdown-value">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className={`dropdown-arrow ${isOpen ? 'up' : 'down'}`}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="1.5" 
                d="M6 8l4 4 4-4"
              />
            </svg>
          </span>
        </button>
      </div>
      
      {dropdownOptions && createPortal(dropdownOptions, document.body)}
    </>
  );
};

export default CustomDropdown;