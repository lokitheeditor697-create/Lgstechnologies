import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import authRoutes from './routes/auth';
import internshipRoutes from './routes/internships';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1); // Trust Render's proxy for express-rate-limit

// Security Middlewares
app.use(helmet()); // Set security HTTP headers
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Rate Limiting (200 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api', limiter);

app.use(cors());
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent payload attacks
app.use(express.static(path.join(process.cwd(), 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('CodeTech API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

