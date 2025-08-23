// MoneyFlow_Frontend/cypress/support/commands.js
// Custom commands for MoneyFlow app

Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/login');
});

Cypress.Commands.add('createAccount', (name, type, balance) => {
  cy.get('[data-testid="add-account-button"]').click();
  cy.get('[data-testid="account-name"]').type(name);
  cy.get('[data-testid="account-type"]').select(type);
  cy.get('[data-testid="initial-balance"]').type(balance.toString());
  cy.get('[data-testid="save-account"]').click();
});

Cypress.Commands.add('loginUI', (email, password) => {
  cy.visit('/login');
  cy.get('input[type="email"]', { timeout: 10000 }).should('be.visible').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('mockAuthSuccess', () => {
  cy.intercept('POST', '**/auth/login', {
    statusCode: 200,
    body: { token: 'mock-token', user: { email: 'test@example.com' } }
  }).as('loginSuccess');
});

Cypress.Commands.add('mockAuthError', () => {
  cy.intercept('POST', '**/auth/login', {
    statusCode: 401,
    body: { error: 'Invalid credentials' }
  }).as('loginError');
});

// Command to check if app is running
Cypress.Commands.add('checkAppRunning', () => {
  cy.request({
    url: '/',
    failOnStatusCode: false
  }).then((response) => {
    expect(response.status).to.be.oneOf([200, 404])
  })
});

// Comandos básicos sin dependencias específicas

Cypress.Commands.add('visitAndWait', (url) => {
  cy.visit(url, { timeout: 30000 });
  cy.get('body').should('be.visible');
});

Cypress.Commands.add('findAnyInput', (type) => {
  return cy.get(`input[type="${type}"], input[name="${type}"], input[placeholder*="${type}" i]`).first();
});

Cypress.Commands.add('findAnyButton', () => {
  return cy.get('button, input[type="submit"], [role="button"]').first();
});

Cypress.Commands.add('checkAppIsRunning', () => {
  cy.request({
    url: '/',
    failOnStatusCode: false
  }).then((response) => {
    expect(response.status).to.be.oneOf([200, 404, 302]);
  });
});