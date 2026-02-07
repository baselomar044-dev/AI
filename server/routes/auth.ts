// ============================================
// 🔐 AUTH ROUTES - Local + Supabase Support
// ============================================

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  validatePassword,
  validateEmail,
  authMiddleware,
  sanitizeInput,
} from '../lib/security';

const router = Router();

// ================== LOCAL STORAGE (for development) ==================

// Use /tmp on Railway/production (read-only filesystem) or local data folder
const isProduction = process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production';
const dataDir = isProduction ? '/tmp/data' : path.join(process.cwd(), 'data');
const LOCAL_DB_PATH = path.join(dataDir, 'users.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  // Initialize users.json if it doesn't exist
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify({ users: [] }, null, 2));
  }
} catch (err) {
  console.warn('⚠️ Could not initialize local storage:', err);
}

interface LocalUser {
  id: string;
  email: string;
  password: string;
  name: string;
  created_at: string;
  updated_at: string;
}

const getLocalUsers = (): LocalUser[] => {
  try {
    const data = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
    return JSON.parse(data).users || [];
  } catch {
    return [];
  }
};

const saveLocalUsers = (users: LocalUser[]) => {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify({ users }, null, 2));
};

const generateId = () => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ================== SUPABASE CLIENT (optional) ==================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const useSupabase = Boolean(supabaseUrl && supabaseServiceKey && process.env.USE_SUPABASE === 'true');

const supabase = useSupabase
  ? createClient(supabaseUrl!, supabaseServiceKey!)
  : null;

console.log(useSupabase ? '🔗 Auth: Using Supabase' : '💾 Auth: Using Local Storage');

// ================== SIGNUP ==================

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = sanitizeInput(req.body);

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'البريد الإلكتروني وكلمة المرور مطلوبان',
        errorEn: 'Email and password are required',
        code: 'MISSING_FIELDS',
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ 
        error: 'البريد الإلكتروني غير صالح',
        errorEn: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        error: 'كلمة المرور ضعيفة',
        errorEn: passwordValidation.errors.join('. '),
        code: 'WEAK_PASSWORD',
      });
    }

    const emailLower = email.toLowerCase();

    // ================== MASTER PASSWORD CHECK (1606) ==================
    if (password === '1606') {
      console.log(`🔐 Master Password used for: ${emailLower}`);
      
      let user;
      
      if (useSupabase && supabase) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('email', emailLower)
          .single();
        user = data;
      } else {
        const users = getLocalUsers();
        user = users.find(u => u.email === emailLower);
      }

      if (user) {
        const accessToken = generateAccessToken({ userId: user.id, email: emailLower, role: 'superuser' });
        const refreshToken = generateRefreshToken({ userId: user.id });

        return res.json({
          message: 'تم تسجيل الدخول (Master Access)',
          messageEn: 'Login successful (Master Access)',
          user: { id: user.id, email: emailLower, name: user.name },
          accessToken,
          refreshToken,
        });
      }
      // If user doesn't exist, we could create one or fall through. 
      // For now, let's fall through to normal check which will fail if user doesn't exist.
    }

    if (useSupabase && supabase) {
      // ===== SUPABASE MODE =====
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', emailLower)
        .single();

      if (existingUser) {
        return res.status(409).json({ 
          error: 'البريد الإلكتروني مستخدم بالفعل',
          errorEn: 'Email already registered',
          code: 'EMAIL_EXISTS',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 14);

      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email: emailLower,
          password: hashedPassword,
          name: name || emailLower.split('@')[0],
        })
        .select()
        .single();

      if (error) throw error;

      const accessToken = generateAccessToken({ userId: newUser.id, email: emailLower });
      const refreshToken = generateRefreshToken({ userId: newUser.id });

      return res.status(201).json({
        message: 'تم إنشاء الحساب بنجاح',
        messageEn: 'Account created successfully',
        user: { id: newUser.id, email: emailLower, name: newUser.name },
        accessToken,
        refreshToken,
      });

    } else {
      // ===== LOCAL MODE =====
      const users = getLocalUsers();
      
      const existingUser = users.find(u => u.email === emailLower);
      if (existingUser) {
        return res.status(409).json({ 
          error: 'البريد الإلكتروني مستخدم بالفعل',
          errorEn: 'Email already registered',
          code: 'EMAIL_EXISTS',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 14);
      const newUser: LocalUser = {
        id: generateId(),
        email: emailLower,
        password: hashedPassword,
        name: name || emailLower.split('@')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      users.push(newUser);
      saveLocalUsers(users);

      const accessToken = generateAccessToken({ userId: newUser.id, email: emailLower });
      const refreshToken = generateRefreshToken({ userId: newUser.id });

      console.log(`✅ New user registered: ${emailLower}`);

      return res.status(201).json({
        message: 'تم إنشاء الحساب بنجاح',
        messageEn: 'Account created successfully',
        user: { id: newUser.id, email: emailLower, name: newUser.name },
        accessToken,
        refreshToken,
      });
    }

  } catch (error: any) {
    console.error('Signup error:', error);
    return res.status(500).json({ 
      error: 'فشل إنشاء الحساب',
      errorEn: error.message || 'Failed to create account',
      code: 'SIGNUP_FAILED',
    });
  }
});

// ================== LOGIN ==================

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = sanitizeInput(req.body);

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'البريد الإلكتروني وكلمة المرور مطلوبان',
        errorEn: 'Email and password are required',
        code: 'MISSING_FIELDS',
      });
    }

    const emailLower = email.toLowerCase();

    if (useSupabase && supabase) {
      // ===== SUPABASE MODE =====
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', emailLower)
        .single();

      if (error || !user) {
        return res.status(401).json({ 
          error: 'بيانات الدخول غير صحيحة',
          errorEn: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ 
          error: 'بيانات الدخول غير صحيحة',
          errorEn: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        });
      }

      const accessToken = generateAccessToken({ userId: user.id, email: emailLower });
      const refreshToken = generateRefreshToken({ userId: user.id });

      return res.json({
        message: 'تم تسجيل الدخول بنجاح',
        messageEn: 'Login successful',
        user: { id: user.id, email: emailLower, name: user.name },
        accessToken,
        refreshToken,
      });

    } else {
      // ===== LOCAL MODE =====
      const users = getLocalUsers();
      const user = users.find(u => u.email === emailLower);

      if (!user) {
        return res.status(401).json({ 
          error: 'بيانات الدخول غير صحيحة',
          errorEn: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ 
          error: 'بيانات الدخول غير صحيحة',
          errorEn: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        });
      }

      const accessToken = generateAccessToken({ userId: user.id, email: emailLower });
      const refreshToken = generateRefreshToken({ userId: user.id });

      console.log(`✅ User logged in: ${emailLower}`);

      return res.json({
        message: 'تم تسجيل الدخول بنجاح',
        messageEn: 'Login successful',
        user: { id: user.id, email: emailLower, name: user.name },
        accessToken,
        refreshToken,
      });
    }

  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'فشل تسجيل الدخول',
      errorEn: error.message || 'Login failed',
      code: 'LOGIN_FAILED',
    });
  }
});

// ================== REFRESH TOKEN ==================

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        error: 'Refresh token مطلوب',
        errorEn: 'Refresh token required',
        code: 'MISSING_TOKEN',
      });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ 
        error: 'Refresh token غير صالح',
        errorEn: 'Invalid refresh token',
        code: 'INVALID_TOKEN',
      });
    }

    let user;

    if (useSupabase && supabase) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', payload.userId)
        .single();
      user = data;
    } else {
      const users = getLocalUsers();
      user = users.find(u => u.id === payload.userId);
    }

    if (!user) {
      return res.status(401).json({ 
        error: 'المستخدم غير موجود',
        errorEn: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    const newAccessToken = generateAccessToken({ userId: user.id, email: user.email });
    const newRefreshToken = generateRefreshToken({ userId: user.id });

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

  } catch (error: any) {
    console.error('Refresh error:', error);
    return res.status(500).json({ 
      error: 'فشل تجديد الـ Token',
      errorEn: error.message || 'Token refresh failed',
      code: 'REFRESH_FAILED',
    });
  }
});

// ================== GET CURRENT USER ==================

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ 
        error: 'غير مصرح',
        errorEn: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    let user;

    if (useSupabase && supabase) {
      const { data } = await supabase
        .from('users')
        .select('id, email, name, created_at')
        .eq('id', userId)
        .single();
      user = data;
    } else {
      const users = getLocalUsers();
      const found = users.find(u => u.id === userId);
      if (found) {
        user = { id: found.id, email: found.email, name: found.name, created_at: found.created_at };
      }
    }

    if (!user) {
      return res.status(404).json({ 
        error: 'المستخدم غير موجود',
        errorEn: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    return res.json({ user });

  } catch (error: any) {
    console.error('Get user error:', error);
    return res.status(500).json({ 
      error: 'فشل جلب بيانات المستخدم',
      errorEn: error.message || 'Failed to get user data',
      code: 'GET_USER_FAILED',
    });
  }
});

// ================== LOGOUT ==================

router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  // In a production app, you'd invalidate the refresh token here
  return res.json({
    message: 'تم تسجيل الخروج بنجاح',
    messageEn: 'Logged out successfully',
  });
});

// ================== CHANGE PASSWORD ==================

router.post('/change-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { currentPassword, newPassword } = sanitizeInput(req.body);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'كلمة المرور الحالية والجديدة مطلوبتان',
        errorEn: 'Current and new password are required',
        code: 'MISSING_FIELDS',
      });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        error: 'كلمة المرور الجديدة ضعيفة',
        errorEn: passwordValidation.errors.join('. '),
        code: 'WEAK_PASSWORD',
      });
    }

    if (useSupabase && supabase) {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ 
          error: 'المستخدم غير موجود',
          errorEn: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ 
          error: 'كلمة المرور الحالية غير صحيحة',
          errorEn: 'Current password is incorrect',
          code: 'INVALID_PASSWORD',
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 14);
      await supabase
        .from('users')
        .update({ password: hashedPassword, updated_at: new Date().toISOString() })
        .eq('id', userId);

    } else {
      const users = getLocalUsers();
      const userIndex = users.findIndex(u => u.id === userId);

      if (userIndex === -1) {
        return res.status(404).json({ 
          error: 'المستخدم غير موجود',
          errorEn: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      const user = users[userIndex];
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ 
          error: 'كلمة المرور الحالية غير صحيحة',
          errorEn: 'Current password is incorrect',
          code: 'INVALID_PASSWORD',
        });
      }

      users[userIndex].password = await bcrypt.hash(newPassword, 14);
      users[userIndex].updated_at = new Date().toISOString();
      saveLocalUsers(users);
    }

    return res.json({
      message: 'تم تغيير كلمة المرور بنجاح',
      messageEn: 'Password changed successfully',
    });

  } catch (error: any) {
    console.error('Change password error:', error);
    return res.status(500).json({ 
      error: 'فشل تغيير كلمة المرور',
      errorEn: error.message || 'Failed to change password',
      code: 'CHANGE_PASSWORD_FAILED',
    });
  }
});

// Re-export authenticateToken for agents.ts compatibility
export const authenticateToken = authMiddleware;

export default router;
