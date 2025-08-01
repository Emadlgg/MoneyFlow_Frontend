require('@testing-library/jest-dom');

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
global.fetch = jest.fn();

beforeEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
  fetch.mockClear();
});