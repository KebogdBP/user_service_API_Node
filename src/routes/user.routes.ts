import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validate, registerSchema, loginSchema } from '../middleware/validation.middleware';

const router = Router();

// ============ PUBLIC ROUTES ============

/**
 * @route   POST /api/users/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', validate(registerSchema), UserController.register);

/**
 * @route   POST /api/users/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post('/login', validate(loginSchema), UserController.login);

// ============ PROTECTED ROUTES ============
router.use(authenticate);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (self or admin)
 * @access  Private
 */
router.get('/:id', UserController.getById);

/**
 * @route   PATCH /api/users/:id/block
 * @desc    Block/unblock user (self or admin)
 * @access  Private
 */
router.patch('/:id/block', UserController.toggleBlock);

// ============ ADMIN ONLY ROUTES ============

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get('/', requireAdmin, UserController.getAll);

export default router;