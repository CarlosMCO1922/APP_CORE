// Campo de texto com sugestões após N caracteres — seleção de clientes (utilizadores).
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';

const MIN_CHARS_DEFAULT = 3;

const normalize = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`;

const InputRow = styled.div`
  position: relative;
  width: 100%;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 10px 36px 10px 12px;
  box-sizing: border-box;
  background-color: ${({ theme }) => theme.colors.inputBg};
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.inputText};
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusRing};
  }
  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const ClearBtn = styled.button`
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  &:hover {
    color: ${({ theme }) => theme.colors.textMain};
    background: ${({ theme }) => theme.colors.buttonSecondaryBg};
  }
`;

const Dropdown = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  z-index: 1200;
  background: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
  max-height: 260px;
  overflow-y: auto;
`;

const Hint = styled.div`
  padding: 12px;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const OptionRow = styled.button`
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.inputBorder};
  background: ${({ theme, $active }) => ($active ? theme.colors.buttonSecondaryBg : 'transparent')};
  color: ${({ theme }) => theme.colors.textMain};
  cursor: pointer;
  font-size: 0.9rem;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: ${({ theme }) => theme.colors.buttonSecondaryBg};
  }
`;

const PrimaryLine = styled.div`
  font-weight: 600;
`;

const SecondaryLine = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
`;

function defaultInputLabel(u) {
  return [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email || `#${u.id}`;
}

function defaultSecondary(u) {
  return u.email ? String(u.email) : '';
}

/**
 * @param {string|number} value - id do utilizador ou ''
 * @param {(e: { target: { name?: string, value: string } }) => void} onChange
 * @param {Array<object>} users
 */
const ClientTypeaheadSelect = ({
  id,
  name,
  value,
  onChange,
  users = [],
  placeholder = 'Escreve pelo menos 3 letras para pesquisar…',
  disabled = false,
  required = false,
  minChars = MIN_CHARS_DEFAULT,
  getInputLabel = defaultInputLabel,
  getResultPrimary = defaultInputLabel,
  getResultSecondary = defaultSecondary,
  'aria-label': ariaLabel,
  ...rest
}) => {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // Sincronizar texto com id escolhido (não limpar quando value fica '' — o utilizador pode estar a escrever a pesquisa).
  useEffect(() => {
    if (!value) return;
    const u = users.find((x) => String(x.id) === String(value));
    if (u) setText(getInputLabel(u));
  }, [value, users, getInputLabel]);

  const term = text.trim();
  const termNorm = normalize(term);

  const matches = useMemo(() => {
    if (termNorm.length < minChars) return [];
    return users.filter((u) => {
      const blob = normalize(
        [u.firstName, u.lastName, u.email, `${u.firstName || ''} ${u.lastName || ''}`].join(' ')
      );
      return blob.includes(termNorm);
    });
  }, [users, termNorm, minChars]);

  useEffect(() => {
    setHighlight(0);
  }, [matches.length, termNorm]);

  const emit = useCallback(
    (nextId) => {
      onChange({ target: { name: name || '', value: nextId === '' || nextId == null ? '' : String(nextId) } });
    },
    [onChange, name]
  );

  const pickUser = useCallback(
    (u) => {
      emit(u.id);
      setText(getInputLabel(u));
      setOpen(false);
      inputRef.current?.blur();
    },
    [emit, getInputLabel]
  );

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) {
        setOpen(false);
        if (value) {
          const u = users.find((x) => String(x.id) === String(value));
          setText(u ? getInputLabel(u) : '');
        }
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [value, users, getInputLabel]);

  const showPanel = open && !disabled;
  const showHint = showPanel && termNorm.length > 0 && termNorm.length < minChars;
  const showList = showPanel && termNorm.length >= minChars;

  const onKeyDown = (e) => {
    if (!showList || matches.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const u = matches[highlight];
      if (u) pickUser(u);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    emit('');
    setText('');
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <Wrapper ref={wrapRef} {...rest}>
      <InputRow>
        <TextInput
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          placeholder={placeholder}
          value={text}
          aria-label={ariaLabel || placeholder}
          aria-autocomplete="list"
          aria-expanded={showPanel}
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            setOpen(true);
            const trimmed = v.trim();
            if (!trimmed) {
              emit('');
              return;
            }
            const u = value ? users.find((x) => String(x.id) === String(value)) : null;
            if (u) {
              const lab = getInputLabel(u).trim();
              if (normalize(trimmed) !== normalize(lab)) {
                emit('');
              }
            }
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {!!value && !required && !disabled && (
          <ClearBtn type="button" onClick={handleClear} aria-label="Limpar cliente">
            <FaTimes size={14} />
          </ClearBtn>
        )}
      </InputRow>

      {showPanel && (
        <Dropdown role="listbox">
          {showHint && <Hint>Escreve pelo menos {minChars} letras para ver sugestões.</Hint>}
          {showList && matches.length === 0 && <Hint>Sem resultados para «{term}».</Hint>}
          {showList &&
            matches.map((u, i) => (
              <OptionRow
                key={u.id}
                type="button"
                role="option"
                $active={i === highlight}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickUser(u)}
              >
                <PrimaryLine>{getResultPrimary(u)}</PrimaryLine>
                {!!getResultSecondary(u) && <SecondaryLine>{getResultSecondary(u)}</SecondaryLine>}
              </OptionRow>
            ))}
        </Dropdown>
      )}
    </Wrapper>
  );
};

export default ClientTypeaheadSelect;
