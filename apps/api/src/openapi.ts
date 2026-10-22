export const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'FlowBudget API',
    version: '1.0.0',
    description: 'REST API do zarządzania finansami osobistymi.',
  },
  servers: [{ url: '/api' }],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Rejestracja',
        responses: {
          '201': { description: 'Utworzono konto' },
          '400': { description: 'Błąd walidacji' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Logowanie',
        responses: {
          '200': { description: 'Zalogowano' },
          '401': { description: 'Nieprawidłowe dane' },
        },
      },
    },
    '/accounts': {
      get: {
        summary: 'Lista kont',
        security: [{ cookieAuth: [] }],
        responses: { '200': { description: 'Konta z saldami' } },
      },
      post: {
        summary: 'Nowe konto',
        security: [{ cookieAuth: [], csrf: [] }],
        responses: { '201': { description: 'Utworzono' } },
      },
    },
    '/transactions': {
      get: {
        summary: 'Transakcje',
        security: [{ cookieAuth: [] }],
        responses: { '200': { description: 'Strona wyników' } },
      },
      post: {
        summary: 'Nowa transakcja',
        security: [{ cookieAuth: [], csrf: [] }],
        responses: { '201': { description: 'Utworzono' } },
      },
    },
    '/budgets': {
      get: {
        summary: 'Budżety',
        security: [{ cookieAuth: [] }],
        responses: { '200': { description: 'Budżety' } },
      },
    },
    '/imports/preview': {
      post: {
        summary: 'Podgląd CSV',
        security: [{ cookieAuth: [], csrf: [] }],
        responses: { '200': { description: 'Znormalizowane rekordy' } },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'flowbudget_session' },
      csrf: { type: 'apiKey', in: 'header', name: 'x-csrf-token' },
    },
  },
};
