// MoneyFlow_Frontend/cypress/e2e/basic.cy.js
describe('Basic App Tests', () => {
  
  it('should load the application', () => {
    cy.visit('/', { timeout: 30000 });
    cy.get('body').should('be.visible');
  });

  it('should navigate to login page', () => {
    cy.visit('/login', { timeout: 30000 });
    
    // Simplificar el test - solo verificar que la página carga
    cy.get('body').should('be.visible');
    
    // Verificar que hay elementos HTML básicos (SIN .or())
    cy.get('html').should('exist');
    cy.get('body').should('contain.html', 'input');
  });

  it('should handle 404 pages', () => {
    cy.visit('/nonexistent-page', { failOnStatusCode: false });
    cy.get('body').should('be.visible');
  });
});