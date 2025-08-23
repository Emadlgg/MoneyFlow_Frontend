// MoneyFlow_Frontend/cypress/support/e2e.js
import './commands'

// Cypress configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  // when there are uncaught exceptions (like React errors in dev mode)
  return false
})

// Custom commands and configurations
beforeEach(() => {
  // Clear localStorage before each test
  cy.clearLocalStorage()
})