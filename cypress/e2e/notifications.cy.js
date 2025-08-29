describe('Notificaciones - UI y pruebas', () => {
  beforeEach(() => {
    cy.visit('/notifications');
  });

  it('muestra la página y toggles funcionan y persisten', () => {
    cy.get('[data-testid="toggle-taxDue"]').as('tax');
    cy.get('@tax').should('exist').uncheck({ force: true }).check({ force: true });
    cy.get('[data-testid="save-btn"]').click();
    cy.reload();
    cy.get('[data-testid="toggle-taxDue"]').should('be.checked');
  });

  it('envía notificación de prueba y aparece toast', () => {
    cy.get('[data-testid="test-lowBalance"]').click();
    cy.get('[data-testid="toasts"]').should('exist');
    cy.get('.toast').first().should('contain.text', 'Saldo bajo (prueba)');
  });

  it('reset limpia preferencias', () => {
    cy.get('[data-testid="toggle-monthlyLimitExceeded"]').check({ force: true });
    cy.get('[data-testid="save-btn"]').click();
    cy.get('[data-testid="reset-btn"]').click();
    cy.reload();
    cy.get('[data-testid="toggle-monthlyLimitExceeded"]').should('not.be.checked');
  });
});