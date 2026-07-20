"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const emailService_1 = require("../services/emailService");
const google_auth_library_1 = require("google-auth-library");
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID || '669166573273-e0bn8vop2f9bclrreffpb1p9ap2e014c.apps.googleusercontent.com');
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, college, department, year, password } = req.body;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                college,
                password: hashedPassword,
                // In real scenario, store department and year in a profile or user model
            },
        });
        res.status(201).json({ message: 'User registered successfully', userId: user.id });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        // Auto-upgrade the main account to ADMIN
        if (user.email === 'lgstechnologiess@gmail.com' && user.role !== 'ADMIN') {
            await prisma.user.update({
                where: { id: user.id },
                data: { role: 'ADMIN' }
            });
            user.role = 'ADMIN';
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, college, phone, currentPassword, newPassword } = req.body;
        const dataToUpdate = {};
        if (name)
            dataToUpdate.name = name;
        if (college)
            dataToUpdate.college = college;
        if (phone)
            dataToUpdate.phone = phone;
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Current password is required to set a new password' });
            }
            // Verify current password
            const currentUser = await prisma.user.findUnique({ where: { id } });
            if (!currentUser) {
                return res.status(404).json({ error: 'User not found' });
            }
            const isMatch = await bcrypt_1.default.compare(currentPassword, currentUser.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Incorrect current password' });
            }
            dataToUpdate.password = await bcrypt_1.default.hash(newPassword, 10);
        }
        const user = await prisma.user.update({
            where: { id },
            data: dataToUpdate,
        });
        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                college: user.college,
                phone: user.phone
            }
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Don't leak if user exists, just return success message
            return res.json({ message: 'If an account exists, a reset link was sent.' });
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken, resetTokenExpiry }
        });
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        await (0, emailService_1.sendPasswordResetEmail)(user.email, resetLink);
        res.json({ message: 'If an account exists, a reset link was sent.' });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gte: new Date() }
            }
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token.' });
        }
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });
        res.json({ message: 'Password has been successfully reset.' });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/google', async (req, res) => {
    try {
        const { token } = req.body;
        // Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID || '669166573273-e0bn8vop2f9bclrreffpb1p9ap2e014c.apps.googleusercontent.com',
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ error: 'Invalid Google token' });
        }
        const { email, name } = payload;
        // Check if user exists
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Auto-create user with random secure password
            const randomPassword = crypto_1.default.randomBytes(16).toString('hex');
            const hashedPassword = await bcrypt_1.default.hash(randomPassword, 10);
            user = await prisma.user.create({
                data: {
                    email,
                    name: name || 'Student',
                    password: hashedPassword,
                }
            });
        }
        // Auto-upgrade the main account to ADMIN
        if (user.email === 'lgstechnologiess@gmail.com' && user.role !== 'ADMIN') {
            await prisma.user.update({
                where: { id: user.id },
                data: { role: 'ADMIN' }
            });
            user.role = 'ADMIN';
        }
        // Generate our app's JWT
        const jwtToken = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token: jwtToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }
    catch (error) {
        console.error('Google Auth Error:', error);
        res.status(500).json({ error: 'Failed to authenticate with Google', details: error.message, stack: error.stack });
    }
});
