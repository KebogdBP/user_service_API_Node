import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { RegisterInput, LoginInput, UserResponse } from '../types';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export class UserService {
  
  async create(data: RegisterInput) {
    // Проверка существования пользователя
    const existing = await prisma.user.findUnique({ 
      where: { email: data.email } 
    });
    
    if (existing) {
      throw new Error('Email already exists');
    }

    // Валидация даты
    const birthDate = new Date(data.birthDate);
    if (isNaN(birthDate.getTime())) {
      throw new Error('Invalid birth date format');
    }

    // Хеширование пароля
    const hashedPassword = await hashPassword(data.password);
    
    // Создание пользователя
    return prisma.user.create({
      data: {
        fullName: data.fullName,
        birthDate: birthDate,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        role: 'USER',
        isActive: true,
      },
    });
  }

  async authenticate({ email, password }: LoginInput): Promise<string | null> {
    const user = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });
    
    // Проверка существования и активности
    if (!user || !user.isActive) {
      return null;
    }

    // Проверка пароля
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return null;
    }

    // Генерация JWT
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { 
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'user-service',
        audience: 'user-service'
      }
    );
  }

  async findById(id: number): Promise<UserResponse | null> {
    const user = await prisma.user.findUnique({ 
      where: { id },
      select: {
        id: true,
        fullName: true,
        birthDate: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return user;
  }

  async findAll(): Promise<Omit<UserResponse, 'birthDate'>[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        birthDate: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return users;
  }

  async toggleActive(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    
    if (!user) {
      throw new Error('User not found');
    }

    return prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        isActive: true,
        email: true,
      },
    });
  }

  async updatePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
      return false;
    }

    const hashedPassword = await hashPassword(newPassword);
    
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    
    return true;
  }
}