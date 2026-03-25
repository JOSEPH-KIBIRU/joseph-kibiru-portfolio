const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio-projects',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'limit' },
      { quality: 'auto' }
    ],
    format: async (req, file) => 'webp' // Convert to webp
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://josephkibiruportfolio.netlify.app',
  'https://joseph-kibiru-admin.vercel.app',
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Remove trailing slash for comparison
    const cleanOrigin = origin.replace(/\/$/, '');
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(cleanOrigin) !== -1 || 
        allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // In development, allow all
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    return callback(new Error('CORS policy does not allow access from this origin'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Create uploads directory for fallback (optional)
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio';

console.log('MongoDB URI exists:', !!MONGODB_URI);
console.log('Cloudinary configured:', !!process.env.CLOUDINARY_CLOUD_NAME);
console.log('Cloudinary cloud name:', process.env.CLOUDINARY_CLOUD_NAME);

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  createAdminUser();
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
});

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Project Schema
const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  technologies: [{ type: String }],
  imageUrl: { type: String },
  imagePublicId: { type: String },
  liveUrl: String,
  githubUrl: String,
  featured: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
  order: { type: Number, default: 0 }
});

const User = mongoose.model('User', UserSchema);
const Project = mongoose.model('Project', ProjectSchema);

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to delete image from Cloudinary
const deleteCloudinaryImage = async (publicId) => {
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log('Deleted image from Cloudinary:', publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
    }
  }
};

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Portfolio API is running', 
    environment: process.env.NODE_ENV,
    cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME
  });
});

// Test endpoint to check environment variables
app.get('/api/test-env', (req, res) => {
  res.json({
    mongoExists: !!process.env.MONGODB_URI,
    jwtExists: !!process.env.JWT_SECRET,
    adminEmailExists: !!process.env.ADMIN_EMAIL,
    cloudinaryExists: !!process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryName: process.env.CLOUDINARY_CLOUD_NAME,
    frontendUrl: process.env.FRONTEND_URL,
    nodeEnv: process.env.NODE_ENV
  });
});

// Auth Routes
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for email:', email);
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '24h' }
    );

    console.log('Login successful for:', email);
    
    res.json({ 
      token, 
      success: true,
      user: { email: user.email, username: user.username, isAdmin: user.isAdmin }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Verify token endpoint
app.get('/api/verify-token', authenticateToken, async (req, res) => {
  try {
    console.log('Token verified for user:', req.user.email);
    res.json({ 
      valid: true, 
      user: {
        id: req.user.id,
        email: req.user.email,
        isAdmin: req.user.isAdmin
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ valid: false, error: error.message });
  }
});

// Project Routes (Public)
app.get('/api/projects', async (req, res) => {
  try {
    console.log('Fetching projects...');
    const { category, featured } = req.query;
    let query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (featured === 'true') {
      query.featured = true;
    }
    
    const projects = await Project.find(query).sort({ order: 1, date: -1 });
    console.log(`Found ${projects.length} projects`);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/featured', async (req, res) => {
  try {
    const projects = await Project.find({ featured: true })
      .sort({ order: 1, date: -1 })
      .limit(6);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching featured projects:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin Routes (Protected)
app.post('/api/admin/projects', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    let projectData;
    
    if (req.body.data) {
      projectData = JSON.parse(req.body.data);
    } else {
      projectData = req.body;
    }

    if (req.file) {
      // Cloudinary provides the URL and public ID
      projectData.imageUrl = req.file.path;
      projectData.imagePublicId = req.file.filename;
    }

    const project = new Project(projectData);
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.put('/api/admin/projects/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    let projectData;
    
    if (req.body.data) {
      projectData = JSON.parse(req.body.data);
    } else {
      projectData = req.body;
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Handle image update
    if (req.file) {
      // Delete old image from Cloudinary
      if (project.imagePublicId) {
        await deleteCloudinaryImage(project.imagePublicId);
      }
      // Set new image data
      projectData.imageUrl = req.file.path;
      projectData.imagePublicId = req.file.filename;
    } else {
      // Keep existing image
      projectData.imageUrl = project.imageUrl;
      projectData.imagePublicId = project.imagePublicId;
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id, 
      projectData, 
      { new: true, runValidators: true }
    );
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.delete('/api/admin/projects/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Delete image from Cloudinary
    if (project.imagePublicId) {
      await deleteCloudinaryImage(project.imagePublicId);
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.post('/api/admin/projects/reorder', authenticateToken, async (req, res) => {
  try {
    const { projects } = req.body;
    
    for (let i = 0; i < projects.length; i++) {
      await Project.findByIdAndUpdate(projects[i]._id, { order: i });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering projects:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Create default admin user from environment variables
async function createAdminUser() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      console.log('⚠️  Admin credentials not set in .env file');
      return;
    }

    const adminExists = await User.findOne({ email: adminEmail });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        username: 'admin',
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true
      });
      console.log('✅ Admin user created with email:', adminEmail);
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Configured ✅' : 'Not configured ❌'}`);
  console.log(`✅ Allowed origins:`, allowedOrigins);
});