require('@testing-library/jest-dom');

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(), 
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock;

// ✅ SOLUCION: Mock de fetch que SÍ funciona
Object.defineProperty(global, 'fetch', {
  value: jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    })
  ),
  writable: true,
});

beforeEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
  global.fetch.mockClear();
});