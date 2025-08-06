module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy', 
  },
  
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js|jsx)',
    '**/?(*.)+(spec|test).(ts|tsx|js|jsx)',
    '**/src/test/**/*.(test|spec).(ts|tsx|js|jsx)'
  ],
  
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }],
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  collectCoverageFrom: [
    'src/**/*.(ts|tsx|js|jsx)',
    '!**/node_modules/**',
    '!**/*.d.ts'
  ],
  
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  }
}