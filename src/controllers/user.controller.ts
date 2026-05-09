import { Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest, RegisterInput, LoginInput } from '../types';

const userService = new UserService();

export class UserController {
  
  // 1. Регистрация пользователя
  static async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { fullName, birthDate, email, password } = req.body as RegisterInput;
      
      const user = await userService.create({
        fullName,
        birthDate,
        email,
        password,
      });
      
      res.status(201).json({ 
        message: 'User registered successfully', 
        userId: user.id,
        email: user.email 
      });
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.message === 'Email already exists') {
        res.status(409).json({ error: error.message });
        return;
      }
      
      if (error.message === 'Invalid birth date format') {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Registration failed. Please try again later.' });
    }
  }

  // 2. Авторизация пользователя
  static async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body as LoginInput;
      
      const token = await userService.authenticate({ email, password });
      
      if (!token) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }
      
      res.json({ 
        message: 'Login successful',
        token,
        tokenType: 'Bearer',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      });
      
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed. Please try again later.' });
    }
  }

  // 3. Получение пользователя по ID
  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);
      
      if (isNaN(userId)) {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }

      const requester = req.user;
      if (!requester) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Проверка прав доступа
      if (requester.role !== 'ADMIN' && requester.id !== userId) {
        res.status(403).json({ error: 'Access denied. You can only view your own profile.' });
        return;
      }

      const user = await userService.findById(userId);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user);
      
    } catch (error: any) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  }

  // 4. Получение списка пользователей (только для админа)
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }

      const users = await userService.findAll();
      res.json({ 
        count: users.length,
        users 
      });
      
    } catch (error: any) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users list' });
    }
  }

  // 5. Блокировка/разблокировка пользователя
  static async toggleBlock(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);
      
      if (isNaN(userId)) {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }

      const requester = req.user;
      if (!requester) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Проверка прав: админ или сам пользователь
      if (requester.role !== 'ADMIN' && requester.id !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const updated = await userService.toggleActive(userId);
      
      res.json({ 
        message: `User ${updated.isActive ? 'activated' : 'blocked'} successfully`, 
        userId: updated.id,
        email: updated.email,
        isActive: updated.isActive
      });
      
    } catch (error: any) {
      console.error('Toggle block error:', error);
      
      if (error.message === 'User not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to update user status' });
    }
  }
}