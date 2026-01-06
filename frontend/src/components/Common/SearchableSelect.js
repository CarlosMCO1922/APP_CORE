// src/components/Common/SearchableSelect.js
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FaSearch, FaTimes, FaChevronDown } from 'react-icons/fa';

const SelectContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SelectButton = styled.button`
  width: 100%;
  padding: 10px 12px;
  background-color: ${({ theme }) => theme.colors.inputBg};
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: 6px;
  color: ${({ theme }) => theme.colors.inputText};
  font-size: 0.95rem;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusRing};
  }
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
  
  ${props => props.$isOpen && `
    border-color: ${props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props.theme.colors.primaryFocusRing};
  `}
`;

const SelectValue = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme, $placeholder }) => $placeholder ? theme.colors.textMuted : theme.colors.inputText};
`;

const ChevronIcon = styled(FaChevronDown)`
  transition: transform 0.2s;
  transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-left: 8px;
  flex-shrink: 0;
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  max-height: 300px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideDown 0.2s ease-out;
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const SearchInputContainer = styled.div`
  padding: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.inputBorder};
  position: sticky;
  top: 0;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  z-index: 1;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px 8px 36px;
  background-color: ${({ theme }) => theme.colors.inputBg};
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.inputText};
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusRing};
  }
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.85rem;
  pointer-events: none;
`;

const OptionsList = styled.div`
  overflow-y: auto;
  max-height: 240px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 3px;
    
    &:hover {
      background: ${({ theme }) => theme.colors.primaryHover};
    }
  }
`;

const Option = styled.div`
  padding: 10px 12px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textMain};
  transition: background-color 0.15s;
  border-bottom: 1px solid ${({ theme }) => theme.colors.inputBorder};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  }
  
  ${props => props.$isSelected && `
    background-color: ${props.theme.colors.primary}30;
    color: ${props.theme.colors.primary};
    font-weight: 600;
  `}
  
  ${props => props.$highlighted && `
    background-color: ${props.theme.colors.buttonSecondaryBg};
  `}
`;

const NoResults = styled.div`
  padding: 20px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9rem;
`;

const ClearButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
    color: ${({ theme }) => theme.colors.textMain};
  }
`;

const SearchableSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Selecione...',
  getOptionLabel = (option) => option.name || option.label || String(option),
  getOptionValue = (option) => option.id || option.value || option,
  searchable = true,
  required = false,
  id,
  name,
  disabled = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const optionsListRef = useRef(null);

  // Filtrar opções baseado na pesquisa
  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchTerm.trim()) {
      return options;
    }
    const term = searchTerm.toLowerCase().trim();
    return options.filter(option => {
      const label = getOptionLabel(option).toLowerCase();
      return label.includes(term);
    });
  }, [options, searchTerm, searchable, getOptionLabel]);

  // Encontrar a opção selecionada
  const selectedOption = React.useMemo(() => {
    if (!value) return null;
    return options.find(option => getOptionValue(option) === value) || null;
  }, [options, value, getOptionValue]);

  // Resetar highlightedIndex quando as opções mudam
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
    }
  }, [filteredOptions, isOpen]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focar no input de pesquisa quando abrir
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Navegação com teclado
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
      default:
        break;
    }
  };

  // Scroll para o item destacado
  useEffect(() => {
    if (isOpen && optionsListRef.current && highlightedIndex >= 0) {
      const optionElement = optionsListRef.current.children[highlightedIndex];
      if (optionElement) {
        optionElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (option) => {
    const optionValue = getOptionValue(option);
    onChange({ target: { value: optionValue, name: name || '' } });
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(0);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange({ target: { value: '', name: name || '' } });
    setSearchTerm('');
  };

  const displayValue = selectedOption ? getOptionLabel(selectedOption) : placeholder;
  const isPlaceholder = !selectedOption;

  return (
    <SelectContainer ref={containerRef} {...props}>
      <SelectButton
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        $isOpen={isOpen}
        disabled={disabled}
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <SelectValue $placeholder={isPlaceholder}>
          {displayValue}
        </SelectValue>
        {value && !required && (
          <ClearButton
            type="button"
            onClick={handleClear}
            aria-label="Limpar seleção"
          >
            <FaTimes size={12} />
          </ClearButton>
        )}
        <ChevronIcon $isOpen={isOpen} />
      </SelectButton>

      {isOpen && (
        <Dropdown role="listbox">
          {searchable && (
            <SearchInputContainer>
              <SearchIcon />
              <SearchInput
                ref={searchInputRef}
                type="text"
                placeholder="Pesquisar exercício..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    e.stopPropagation();
                    optionsListRef.current?.focus();
                  }
                }}
              />
            </SearchInputContainer>
          )}
          <OptionsList ref={optionsListRef}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const optionValue = getOptionValue(option);
                const isSelected = value === optionValue;
                const isHighlighted = index === highlightedIndex;

                return (
                  <Option
                    key={optionValue}
                    onClick={() => handleSelect(option)}
                    $isSelected={isSelected}
                    $highlighted={isHighlighted}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {getOptionLabel(option)}
                  </Option>
                );
              })
            ) : (
              <NoResults>Nenhum resultado encontrado</NoResults>
            )}
          </OptionsList>
        </Dropdown>
      )}
    </SelectContainer>
  );
};

export default SearchableSelect;

