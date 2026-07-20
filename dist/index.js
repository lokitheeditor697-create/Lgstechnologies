"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const hpp_1 = __importDefault(require("hpp"));
const auth_1 = __importDefault(require("./routes/auth"));
const internships_1 = __importDefault(require("./routes/internships"));
const admin_1 = __importDefault(require("./routes/admin"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security Middlewares
app.use((0, helmet_1.default)()); // Set security HTTP headers
app.use((0, hpp_1.default)()); // Prevent HTTP Parameter Pollution
// Rate Limiting (200 requests per 15 minutes)
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api', limiter);
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10kb' })); // Limit body size to prevent payload attacks
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/internships', internships_1.default);
app.use('/api/admin', admin_1.default);
app.get('/', (req, res) => {
    res.send('CodeTech API is running...');
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
