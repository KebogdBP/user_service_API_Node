import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      res.status(400).json({ 
        error: 'Validation failed', 
        details: errors 
      });
      return;
    }
    
    req.body = value;
    next();
  };
};

export const registerSchema = Joi.object({
  fullName: Joi.string()
    .min(3)
    .max(255)
    .trim()
    .required()
    .messages({
      'string.empty': 'Full name is required',
      'string.min': 'Full name must be at least 3 characters',
      'string.max': 'Full name cannot exceed 255 characters',
    }),
  
  birthDate: Joi.string()
    .isoDate()
    .required()
    .messages({
      'string.empty': 'Birth date is required',
      'date.format': 'Birth date must be in ISO format (YYYY-MM-DD)',
    }),
  
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address',
    }),
  
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters',
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address',
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
    }),
}); 