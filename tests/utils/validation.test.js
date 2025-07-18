/**
 * @jest-environment jsdom
 */

// Funciones de validación corregidas
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // Corregir la validación para manejar strings vacíos y null correctamente
  if (!password || typeof password !== 'string') {
    return false;
  }
  return password.length >= 6;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const calculateBalance = (transactions) => {
  return transactions.reduce((balance, transaction) => {
    if (transaction.type === 'income') {
      return balance + transaction.amount;
    } else {
      return balance - transaction.amount;
    }
  }, 0);
};

describe('Frontend Validation Utils', () => {
  describe('Email Validation', () => {
    test('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co')).toBe(true);
      expect(validateEmail('firstname.lastname@company.com')).toBe(true);
    });

    test('should reject invalid emails', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('test.domain.com')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    test('should accept valid passwords', () => {
      expect(validatePassword('123456')).toBe(true);
      expect(validatePassword('password123')).toBe(true);
      expect(validatePassword('very_long_password')).toBe(true);
    });

    test('should reject invalid passwords', () => {
      expect(validatePassword('12345')).toBe(false);
      expect(validatePassword('')).toBe(false);
      expect(validatePassword(null)).toBe(false);
      expect(validatePassword(undefined)).toBe(false);
      expect(validatePassword(123)).toBe(false); // No es string
    });
  });

  describe('Currency Formatting', () => {
    test('should format numbers as currency', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(0.99)).toBe('$0.99');
    });

    test('should handle negative numbers', () => {
      expect(formatCurrency(-100.50)).toBe('-$100.50');
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });
  });

  describe('Balance Calculation', () => {
    test('should calculate balance correctly', () => {
      const transactions = [
        { type: 'income', amount: 1000 },
        { type: 'expense', amount: 300 },
        { type: 'income', amount: 500 },
        { type: 'expense', amount: 150 }
      ];

      expect(calculateBalance(transactions)).toBe(1050); // 1000 + 500 - 300 - 150
    });

    test('should handle empty transactions', () => {
      expect(calculateBalance([])).toBe(0);
    });

    test('should handle only income transactions', () => {
      const transactions = [
        { type: 'income', amount: 1000 },
        { type: 'income', amount: 500 }
      ];

      expect(calculateBalance(transactions)).toBe(1500);
    });

    test('should handle only expense transactions', () => {
      const transactions = [
        { type: 'expense', amount: 300 },
        { type: 'expense', amount: 150 }
      ];

      expect(calculateBalance(transactions)).toBe(-450);
    });
  });

  describe('Form Validation Integration', () => {
    test('should validate complete form data', () => {
      const validateFormData = (data) => {
        return {
          email: validateEmail(data.email),
          password: validatePassword(data.password),
          amount: data.amount && !isNaN(data.amount) && data.amount > 0
        };
      };

      const validData = {
        email: 'test@example.com',
        password: 'password123',
        amount: 100.50
      };

      const invalidData = {
        email: 'invalid-email',
        password: '123',
        amount: -50
      };

      const validResult = validateFormData(validData);
      expect(validResult.email).toBe(true);
      expect(validResult.password).toBe(true);
      expect(validResult.amount).toBe(true);

      const invalidResult = validateFormData(invalidData);
      expect(invalidResult.email).toBe(false);
      expect(invalidResult.password).toBe(false);
      expect(invalidResult.amount).toBe(false);
    });
  });

  describe('Data Sanitization', () => {
    test('should sanitize user input', () => {
      const sanitizeInput = (input) => {
        if (typeof input !== 'string') return '';
        return input.trim().replace(/[<>]/g, '');
      };

      expect(sanitizeInput('  hello world  ')).toBe('hello world');
      expect(sanitizeInput('<script>alert("test")</script>')).toBe('scriptalert("test")/script');
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
      expect(sanitizeInput(123)).toBe('');
    });

    test('should format transaction description', () => {
      const formatDescription = (description) => {
        if (!description || typeof description !== 'string') return '';
        return description.trim().charAt(0).toUpperCase() + description.trim().slice(1).toLowerCase();
      };

      expect(formatDescription('grocery shopping')).toBe('Grocery shopping');
      expect(formatDescription('  LUNCH  ')).toBe('Lunch');
      expect(formatDescription('')).toBe('');
      expect(formatDescription(null)).toBe('');
    });
  });
});