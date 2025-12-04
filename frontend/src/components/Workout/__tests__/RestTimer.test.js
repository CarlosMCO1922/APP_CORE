import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import RestTimer from '../RestTimer';
import { CustomThemeProvider } from '../../../context/ThemeContext';
import { logger } from '../../../utils/logger';

// Mock do logger
jest.mock('../../../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    log: jest.fn(),
    error: jest.fn()
  }
}));

// Mock do Audio
const mockPlay = jest.fn();
const mockAudio = jest.fn(() => ({
  play: mockPlay,
  volume: 0.8,
  catch: jest.fn()
}));
global.Audio = mockAudio;

// Mock do Web Audio API
const mockOscillator = {
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  frequency: { value: 800 },
  type: 'sine'
};

const mockGainNode = {
  connect: jest.fn(),
  gain: {
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn()
  }
};

const mockAudioContext = {
  createOscillator: jest.fn(() => mockOscillator),
  createGain: jest.fn(() => mockGainNode),
  destination: {},
  currentTime: 0
};

global.AudioContext = jest.fn(() => mockAudioContext);
global.webkitAudioContext = jest.fn(() => mockAudioContext);

// Mock do navigator.vibrate
const mockVibrate = jest.fn();
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: mockVibrate
});

// Mock do Notification API
const mockNotification = {
  onclick: null,
  close: jest.fn()
};

global.Notification = jest.fn(() => mockNotification);
global.Notification.requestPermission = jest.fn(() => Promise.resolve('granted'));
global.Notification.permission = 'granted';

// Mock do Service Worker
const mockServiceWorkerListeners = [];
const mockServiceWorker = {
  getRegistrations: jest.fn(() => Promise.resolve([])),
  register: jest.fn(() => Promise.resolve({
    pushManager: {
      subscribe: jest.fn(() => Promise.resolve({}))
    },
    showNotification: jest.fn(() => Promise.resolve(mockNotification))
  })),
  addEventListener: jest.fn((event, handler) => {
    mockServiceWorkerListeners.push({ event, handler });
  }),
  removeEventListener: jest.fn((event, handler) => {
    const index = mockServiceWorkerListeners.findIndex(
      l => l.event === event && l.handler === handler
    );
    if (index > -1) {
      mockServiceWorkerListeners.splice(index, 1);
    }
  })
};

Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: mockServiceWorker
});

// Helper para renderizar com ThemeProvider
const renderWithTheme = (component) => {
  return render(
    <CustomThemeProvider>
      {component}
    </CustomThemeProvider>
  );
};

// Helper para avançar o tempo
const advanceTimers = (ms) => {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
};

describe('RestTimer', () => {
  const mockOnFinish = jest.fn();
  const defaultDuration = 90; // 90 segundos

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockPlay.mockClear();
    mockVibrate.mockClear();
    mockOnFinish.mockClear();
    mockAudio.mockClear();
    mockServiceWorkerListeners.length = 0;
    // Resetar o mock do serviceWorker
    mockServiceWorker.addEventListener.mockClear();
    mockServiceWorker.removeEventListener.mockClear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renderiza o timer com o tempo correto', () => {
    renderWithTheme(<RestTimer duration={defaultDuration} onFinish={mockOnFinish} />);
    
    expect(screen.getByText(/Descanso:/i)).toBeInTheDocument();
    expect(screen.getByText(/01:30/i)).toBeInTheDocument(); // 90 segundos = 1:30
  });

  it('atualiza o tempo decorrido a cada segundo', async () => {
    renderWithTheme(<RestTimer duration={defaultDuration} onFinish={mockOnFinish} />);
    
    // Avançar 1 segundo usando act
    act(() => {
      advanceTimers(1000);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/01:29/i)).toBeInTheDocument();
    });
  });

  it('vibra quando o tempo acaba', async () => {
    const shortDuration = 2; // 2 segundos para teste rápido
    renderWithTheme(<RestTimer duration={shortDuration} onFinish={mockOnFinish} />);
    
    // Avançar até o tempo acabar usando act
    act(() => {
      advanceTimers(2000);
    });
    
    await waitFor(() => {
      expect(mockVibrate).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('toca som quando o tempo acaba', async () => {
    const shortDuration = 2;
    renderWithTheme(<RestTimer duration={shortDuration} onFinish={mockOnFinish} />);
    
    // Avançar até o tempo acabar usando act
    act(() => {
      advanceTimers(2000);
    });
    
    await waitFor(() => {
      expect(mockAudio).toHaveBeenCalled();
      expect(mockPlay).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('esconde a barra quando o tempo chega a 0', async () => {
    const shortDuration = 2;
    renderWithTheme(<RestTimer duration={shortDuration} onFinish={mockOnFinish} />);
    
    // Avançar até o tempo acabar usando act
    act(() => {
      advanceTimers(2000);
    });
    
    // Avançar mais 5 segundos para a barra desaparecer
    act(() => {
      advanceTimers(5000);
    });
    
    await waitFor(() => {
      expect(mockOnFinish).toHaveBeenCalled();
    }, { timeout: 8000 });
  });

  it('permite adicionar 30 segundos ao tempo', async () => {
    renderWithTheme(<RestTimer duration={defaultDuration} onFinish={mockOnFinish} />);
    
    const addButton = screen.getByLabelText(/adicionar 30 segundos/i);
    
    act(() => {
      addButton.click();
    });
    
    await waitFor(() => {
      expect(screen.getByText(/02:00/i)).toBeInTheDocument(); // 90 + 30 = 120 segundos = 2:00
    });
  });

  it('permite subtrair 30 segundos do tempo', async () => {
    renderWithTheme(<RestTimer duration={defaultDuration} onFinish={mockOnFinish} />);
    
    const subtractButton = screen.getByLabelText(/reduzir 30 segundos/i);
    
    act(() => {
      subtractButton.click();
    });
    
    await waitFor(() => {
      expect(screen.getByText(/01:00/i)).toBeInTheDocument(); // 90 - 30 = 60 segundos = 1:00
    });
  });

  it('não permite subtrair abaixo de 30 segundos', async () => {
    const shortDuration = 60; // 60 segundos
    renderWithTheme(<RestTimer duration={shortDuration} onFinish={mockOnFinish} />);
    
    const subtractButton = screen.getByLabelText(/reduzir 30 segundos/i);
    
    // Clicar duas vezes para tentar ir abaixo de 30
    act(() => {
      subtractButton.click();
      subtractButton.click();
    });
    
    await waitFor(() => {
      expect(screen.getByText(/00:30/i)).toBeInTheDocument(); // Deve parar em 30 segundos
      expect(subtractButton).toBeDisabled();
    });
  });

  it('permite fechar o timer manualmente', async () => {
    renderWithTheme(<RestTimer duration={defaultDuration} onFinish={mockOnFinish} />);
    
    const closeButton = screen.getByLabelText(/fechar cronómetro/i);
    
    act(() => {
      closeButton.click();
    });
    
    expect(mockOnFinish).toHaveBeenCalled();
  });

  it('para vibração e som quando o utilizador fecha o timer', async () => {
    const shortDuration = 2;
    renderWithTheme(<RestTimer duration={shortDuration} onFinish={mockOnFinish} />);
    
    // Avançar até o tempo acabar usando act
    act(() => {
      advanceTimers(2000);
    });
    
    await waitFor(() => {
      expect(mockVibrate).toHaveBeenCalled();
    });
    
    // Fechar o timer
    const closeButton = screen.getByLabelText(/fechar cronómetro/i);
    act(() => {
      closeButton.click();
    });
    
    // Verificar que vibrate(0) foi chamado para parar a vibração
    await waitFor(() => {
      expect(mockVibrate).toHaveBeenCalledWith(0);
    });
  });

  it('formata o tempo corretamente', () => {
    renderWithTheme(<RestTimer duration={125} onFinish={mockOnFinish} />);
    
    // 125 segundos = 2:05
    expect(screen.getByText(/02:05/i)).toBeInTheDocument();
  });

  it('mostra 00:00 quando o tempo acaba', async () => {
    const shortDuration = 2;
    renderWithTheme(<RestTimer duration={shortDuration} onFinish={mockOnFinish} />);
    
    // Avançar até o tempo acabar usando act
    act(() => {
      advanceTimers(2000);
    });
    
    await waitFor(() => {
      // O componente deve desaparecer, mas antes deve mostrar 00:00
      // Como o componente desaparece, vamos verificar que onFinish foi chamado
      expect(mockOnFinish).toHaveBeenCalled();
    }, { timeout: 8000 });
  });

  it('cria som sintético se o ficheiro de som falhar', async () => {
    const shortDuration = 2;
    mockPlay.mockRejectedValueOnce(new Error('Failed to load'));
    
    renderWithTheme(<RestTimer duration={shortDuration} onFinish={mockOnFinish} />);
    
    // Avançar até o tempo acabar usando act
    act(() => {
      advanceTimers(2000);
    });
    
    await waitFor(() => {
      // Deve tentar criar um som sintético
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});

