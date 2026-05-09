import { app } from './app';
import { connectDB, disconnectDB } from './config/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Проверка JWT_SECRET в production
if (NODE_ENV === 'production') {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    console.error('❌ ERROR: JWT_SECRET must be at least 32 characters in production');
    process.exit(1);
  }
}

const startServer = async () => {
  try {
    // Подключение к БД
    await connectDB();
    
    // Запуск сервера
    app.listen(PORT, () => {
      console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
      console.log(`API endpoint: http://localhost:${PORT}/api/users`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
    
    // Обработка сигналов завершения
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  console.log('\n Shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
};

// Запуск
startServer();