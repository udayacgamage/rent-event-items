import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=]).{8,}$/;

const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must include uppercase, lowercase, a number and a special character.';
  }
  return null;
};

const createAccessToken = (user) =>
  jwt.sign(
    { userId: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

const createRefreshToken = (user) =>
  jwt.sign(
    { userId: user._id.toString(), type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const sanitiseUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  address: user.address,
  avatar: user.avatar,
  role: user.role,
  totalSpending: user.totalSpending,
  hasPassword: !!user.passwordHash,
  hasGoogle: !!user.googleId
});

// ---------- Register ----------
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const pwError = validatePassword(password);
    if (pwError) {
      return res.status(400).json({ message: pwError });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: email.toLowerCase(), phone, passwordHash, role: 'customer' });

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    return res.status(201).json({
      token: accessToken,
      refreshToken,
      user: sanitiseUser(user)
    });
  } catch (error) {
    next(error);
  }
});

// ---------- Login ----------
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Google-only users must use Google Sign-In
    if (!user.passwordHash) {
      return res.status(401).json({ message: 'This account uses Google Sign-In. Please sign in with Google.' });
    }

    // Account lockout check
    if (user.isLocked()) {
      const remaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ message: `Account locked. Try again in ${remaining} minute(s).` });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
      }
      await user.save();
      const attemptsLeft = MAX_LOGIN_ATTEMPTS - user.loginAttempts;
      return res.status(401).json({
        message: attemptsLeft > 0
          ? `Invalid credentials. ${attemptsLeft} attempt(s) remaining.`
          : 'Account locked due to too many failed attempts. Try again in 15 minutes.'
      });
    }

    // Reset attempts on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    return res.json({
      token: accessToken,
      refreshToken,
      user: sanitiseUser(user)
    });
  } catch (error) {
    next(error);
  }
});

// ---------- Refresh Token ----------
router.post('/refresh-token', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const newAccessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);
    user.refreshToken = newRefreshToken;
    await user.save();

    return res.json({ token: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    next(error);
  }
});

// ---------- Logout (invalidate refresh token) ----------
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    req.user.refreshToken = undefined;
    await req.user.save();
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// ---------- Change Password ----------
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const isMatch = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const pwError = validatePassword(newPassword);
    if (pwError) {
      return res.status(400).json({ message: pwError });
    }

    req.user.passwordHash = await bcrypt.hash(newPassword, 12);
    req.user.refreshToken = undefined; // force re-login on other devices
    await req.user.save();

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

// ---------- Google Login ----------
router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ message: 'Google OAuth is not configured on the server' });
    }

    const client = new OAuth2Client(clientId);
    let ticket;
    try {
      ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    } catch {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Google account must have an email address' });
    }

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user from Google profile
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        googleId,
        avatar: picture,
        role: 'customer'
      });
    } else {
      // Link Google to existing account if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (picture && !user.avatar) {
        user.avatar = picture;
      }
    }

    // Reset lockout on Google login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    return res.json({
      token: accessToken,
      refreshToken,
      user: sanitiseUser(user)
    });
  } catch (error) {
    next(error);
  }
});

// ---------- Me ----------
router.get('/me', authenticate, async (req, res) => {
  return res.json({ user: sanitiseUser(req.user) });
});

// ---------- Update Profile ----------
router.patch('/profile', authenticate, async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    return res.json({ user: sanitiseUser(user) });
  } catch (error) {
    next(error);
  }
});

export default router;
