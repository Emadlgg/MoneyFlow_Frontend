/**
 * @jest-environment jsdom
 */

describe('Basic Frontend Tests', () => {
  test('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should have DOM available', () => {
    document.body.innerHTML = '<div id="test">Hello World</div>';
    expect(document.getElementById('test').textContent).toBe('Hello World');
  });

  test('should have localStorage mock', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
  });

  test('should have fetch mock', () => {
    expect(typeof fetch).toBe('function');
  });
});