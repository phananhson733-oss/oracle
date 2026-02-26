// Authentication API routes
import { Router, Request, Response, NextFunction } from 'express';
import { randomInt } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { userService, AuthTokens } from '../services/userService.js';
import { supabase, isSupabaseConfigured } from '../db/supabase.js';
import { GOOGLE_CONFIG, isGoogleConfigured, isResendConfigured } from '../config/auth.js';
import { cacheService } from '../cache/redis.js';
import { emailService } from '../services/emailService.js';

const router = Router();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

// Auth middleware (optional - continues without auth if no token)
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Continue without auth
  }

  const token = authHeader.substring(7);
  const payload = userService.verifyToken(token);

  if (!payload || payload.type !== 'access') {
    return next(); // Invalid token, continue without auth
  }

  req.userId = payload.userId;
  req.user = {
    id: payload.userId,
    email: payload.email,
  };

  next();
};

// Optional auth middleware (accepts anonymous, but rejects invalid tokens)
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);
  const payload = userService.verifyToken(token);

  if (!payload || payload.type !== 'access') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.userId = payload.userId;
  req.user = {
    id: payload.userId,
    email: payload.email,
  };

  next();
};

// Require auth middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Helper to send auth response
const sendAuthResponse = (res: Response, tokens: AuthTokens, user: { id: string; email: string; name?: string | null }) => {
  res.json({
    success: true,
    tokens,
    user: {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
    },
  });
};

// Google login
router.post('/google', async (req: Request, res: Response) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ error: 'Authentication service unavailable' });
    }

    if (!isGoogleConfigured()) {
      return res.status(503).json({ error: 'Google login not configured' });
    }

    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential required' });
    }

    // Verify Google token
    const client = new OAuth2Client(GOOGLE_CONFIG.CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CONFIG.CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    // Find or create user
    let user = await userService.findByProvider('google', payload.sub);

    if (!user) {
      // Check if email exists with different provider
      const existingUser = await userService.findByEmail(payload.email);
      if (existingUser) {
        return res.status(400).json({
          error: 'Email already registered with different method',
          provider: existingUser.provider,
        });
      }

      // Create new user
      user = await userService.createUser({
        email: payload.email,
        name: payload.name,
        avatar: payload.picture,
        provider: 'google',
        providerId: payload.sub,
      });
    }

    // Generate tokens
    const tokens = userService.generateTokens(user);

    sendAuthResponse(res, tokens, user);
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Apple login
router.post('/apple', async (req: Request, res: Response) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ error: 'Authentication service unavailable' });
    }

    const { identityToken, user: appleUser } = req.body;

    if (!identityToken) {
      return res.status(400).json({ error: 'Apple identity token required' });
    }

    // TODO: Verify Apple token
    // For now, we'll trust the client-side verification
    // In production, implement server-side verification

    const email = appleUser?.email;
    const name = appleUser?.name?.firstName
      ? `${appleUser.name.firstName} ${appleUser.name.lastName || ''}`.trim()
      : undefined;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Find or create user
    let user = await userService.findByEmail(email);

    if (!user) {
      user = await userService.createUser({
        email,
        name,
        provider: 'apple',
        providerId: appleUser?.user || email,
      });
    } else if (user.provider !== 'apple') {
      return res.status(400).json({
        error: 'Email already registered with different method',
        provider: user.provider,
      });
    }

    const tokens = userService.generateTokens(user);
    sendAuthResponse(res, tokens, user);
  } catch (error) {
    console.error('Apple login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Send verification code for registration
router.post('/send-code', async (req: Request, res: Response) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ error: 'Authentication service unavailable' });
    }

    if (!isResendConfigured()) {
      return res.status(503).json({ error: 'Email service not configured' });
    }

    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = email.toLowerCase();

    // Rate limiting via cacheService (check before DB queries to save resources)
    const cooldownKey = `reg-cooldown:${normalizedEmail}`;
    const dailyKey = `reg-daily:${normalizedEmail}`;

    const cooldownExists = await cacheService.exists(cooldownKey);
    if (cooldownExists) {
      return res.status(429).json({ error: 'Please wait before requesting another code' });
    }

    const dailyCount = await cacheService.get<number>(dailyKey) || 0;
    if (dailyCount >= 10) {
      return res.status(429).json({ error: 'Too many requests today. Please try again tomorrow' });
    }

    // Check if email already registered — return same success response to prevent enumeration
    const existingUser = await userService.findByEmail(normalizedEmail);
    if (existingUser) {
      // Set cooldown so attacker can't rapidly probe emails
      await cacheService.set(cooldownKey, true, 60);
      await cacheService.set(dailyKey, dailyCount + 1, 86400);
      return res.json({ success: true, message: 'Verification code sent' });
    }

    // Generate 6-digit code
    const code = randomInt(100000, 999999).toString();

    // Delete previous unverified codes for this email
    await supabase
      .from('registration_codes')
      .delete()
      .eq('email', normalizedEmail)
      .is('verified_at', null);

    // Insert new code (10 min expiry)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await supabase.from('registration_codes').insert({
      email: normalizedEmail,
      code,
      expires_at: expiresAt.toISOString(),
    });

    // Send email
    await emailService.sendVerificationCode(normalizedEmail, code);

    // Set rate limit keys
    await cacheService.set(cooldownKey, true, 60); // 60s cooldown
    await cacheService.set(dailyKey, dailyCount + 1, 86400); // 24h daily counter

    res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error('Send verification code error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Verify code and complete registration
router.post('/verify-code', async (req: Request, res: Response) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ error: 'Authentication service unavailable' });
    }

    const { email, code: rawCode, password, name } = req.body;

    if (!email || !rawCode || !password) {
      return res.status(400).json({ error: 'Email, code and password required' });
    }

    // Sanitize code: trim whitespace and ensure 6-digit numeric
    const code = String(rawCode).trim();
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = email.toLowerCase();

    // Find the latest unexpired, unverified code
    const { data: codeRecord, error: queryError } = await supabase
      .from('registration_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .is('verified_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (queryError || !codeRecord) {
      return res.status(400).json({ error: 'Code expired or not found. Please request a new one' });
    }

    // Check attempts
    if (codeRecord.attempts >= 3) {
      return res.status(400).json({ error: 'Too many attempts. Please request a new code' });
    }

    // Verify code
    if (codeRecord.code !== code) {
      // Increment attempts
      await supabase
        .from('registration_codes')
        .update({ attempts: codeRecord.attempts + 1 })
        .eq('id', codeRecord.id);

      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Mark as verified
    await supabase
      .from('registration_codes')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', codeRecord.id);

    // Double-check email not taken (race condition guard)
    const existingUser = await userService.findByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user with email_verified: true
    const user = await userService.createUser({
      email: normalizedEmail,
      name: name || undefined,
      password,
      provider: 'email',
    });

    // Mark email as verified since code was validated
    await userService.verifyEmail(user.id);

    // Generate tokens
    const tokens = userService.generateTokens(user);

    sendAuthResponse(res, tokens, user);
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Email registration (direct - no email verification required)
router.post('/register', async (req: Request, res: Response) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ error: 'Authentication service unavailable' });
    }

    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if email exists
    const existingUser = await userService.findByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user
    const user = await userService.createUser({
      email: normalizedEmail,
      name: name || undefined,
      password,
      provider: 'email',
    });

    // Generate tokens
    const tokens = userService.generateTokens(user);

    sendAuthResponse(res, tokens, user);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Email login
router.post('/login', async (req: Request, res: Response) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ error: 'Authentication service unavailable' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await userService.findByEmail(normalizedEmail);

    if (!user || user.provider !== 'email') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await userService.verifyPassword(user, password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const tokens = userService.generateTokens(user);
    sendAuthResponse(res, tokens, user);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const payload = userService.verifyToken(refreshToken);

    if (!payload || payload.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Get user
    const user = await userService.findById(payload.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new tokens
    const tokens = userService.generateTokens(user);

    res.json({
      success: true,
      tokens,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Logout
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await userService.revokeRefreshToken(refreshToken);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user
router.get('/me', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await userService.findById(req.userId!);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider: user.provider,
      birthProfile: user.birth_profile,
      preferences: user.preferences,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update profile
router.put('/profile', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, avatar, birthProfile, preferences } = req.body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;
    if (birthProfile !== undefined) updates.birth_profile = birthProfile;
    if (preferences !== undefined) updates.preferences = preferences;

    const user = await userService.updateProfile(req.userId!, updates as any);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        birthProfile: user.birth_profile,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Migrate localStorage data
router.post('/migrate', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    const { birthProfile, preferences } = req.body;

    if (!birthProfile) {
      return res.status(400).json({ error: 'Birth profile required' });
    }

    const user = await userService.migrateLocalData(
      req.userId!,
      birthProfile,
      preferences || { theme: 'dark', language: 'en' }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Data migrated successfully',
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Migration failed' });
  }
});

// Verify email
router.get('/verify-email/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const userId = await userService.verifyEmailToken(token);

    if (!userId) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;
