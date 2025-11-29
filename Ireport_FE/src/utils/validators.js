import {VALIDATION_RULES} from './constants';

export const validators = {
  required: (value, fieldName = 'Field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    if (!VALIDATION_RULES.email.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  password: (value) => {
    if (!value) return null;
    if (!VALIDATION_RULES.password.test(value)) {
      return 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }
    return null;
  },

  minLength: (value, min, fieldName = 'Field') => {
    if (!value) return null;
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (value, max, fieldName = 'Field') => {
    if (!value) return null;
    if (value.length > max) {
      return `${fieldName} must not exceed ${max} characters`;
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null;
    if (!VALIDATION_RULES.phone.test(value.replace(/\s+/g, ''))) {
      return 'Please enter a valid phone number';
    }
    return null;
  },

  url: (value) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  numeric: (value, fieldName = 'Field') => {
    if (!value) return null;
    if (isNaN(value)) {
      return `${fieldName} must be a number`;
    }
    return null;
  },

  range: (value, min, max, fieldName = 'Field') => {
    if (!value) return null;
    const num = Number(value);
    if (num < min || num > max) {
      return `${fieldName} must be between ${min} and ${max}`;
    }
    return null;
  },
};

export const validateForm = (data, rules) => {
  const errors = {};
  
  for (const field in rules) {
    const fieldRules = rules[field];
    const value = data[field];
    
    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        break; // Stop at first error for this field
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};