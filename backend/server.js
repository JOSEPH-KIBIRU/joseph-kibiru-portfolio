const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio')
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
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
    imageUrl: String,
    liveUrl: String,
    githubUrl: String,
    featured: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
    order: { type: Number, default: 0 }
});

const User = mongoose.model('User', UserSchema);
const Project = mongoose.model('Project', ProjectSchema);

// File Upload Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'));
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

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

// Routes

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt:');
    console.log('   Email:', email);
    console.log('   Password length:', password.length);
    
    // Find user (case insensitive)
    const user = await User.findOne({ 
      email: { $regex: new RegExp('^' + email + '$', 'i') } 
    });
    
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ User found:');
    console.log('   Email:', user.email);
    console.log('   Username:', user.username);
    console.log('   Password hash length:', user.password.length);
    console.log('   Password hash first 20 chars:', user.password.substring(0, 20));
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('   Password valid:', validPassword);
    
    if (!validPassword) {
      console.log('❌ Invalid password for user:', user.email);
      
      // Test with a freshly hashed version of the entered password to see if bcrypt is working
      const testHash = await bcrypt.hash(password, 10);
      console.log('   Test hash of entered password:', testHash.substring(0, 30));
      console.log('   Stored hash first 30 chars:', user.password.substring(0, 30));
      console.log('   Do they match? No - this is expected since we compare, not match strings');
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful for:', user.email);
    
    res.json({ 
      token, 
      success: true,
      user: { email: user.email, username: user.username, isAdmin: user.isAdmin }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Project Routes (Public)
app.get('/api/projects', async (req, res) => {
    try {
        const { category, featured } = req.query;
        let query = {};
        
        if (category && category !== 'all') {
            query.category = category;
        }
        
        if (featured === 'true') {
            query.featured = true;
        }
        
        const projects = await Project.find(query).sort({ order: 1, date: -1 });
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Server error' });
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
        res.status(500).json({ error: 'Server error' });
    }
});


app.get('/api/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Routes (Protected)
app.post('/api/admin/projects', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        let projectData;
        
        if (req.body.data) {
            // Handle FormData
            projectData = JSON.parse(req.body.data);
        } else {
            // Handle JSON
            projectData = req.body;
        }

        if (req.file) {
            projectData.imageUrl = `/uploads/${req.file.filename}`;
        }

        const project = new Project(projectData);
        await project.save();
        res.status(201).json(project);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Server error' });
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
            // Delete old image if exists
            if (project.imageUrl) {
                const oldImagePath = path.join(__dirname, project.imageUrl);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            projectData.imageUrl = `/uploads/${req.file.filename}`;
        }

        const updatedProject = await Project.findByIdAndUpdate(
            req.params.id, 
            projectData, 
            { new: true, runValidators: true }
        );
        
        res.json(updatedProject);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/admin/projects/:id', authenticateToken, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Delete image file
        if (project.imageUrl) {
            const imagePath = path.join(__dirname, project.imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await Project.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Server error' });
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
        res.status(500).json({ error: 'Server error' });
    }
});

// Create default admin user using environment variables
async function createAdminUser() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        
        // Only create if credentials are provided in .env
        if (!adminEmail || !adminPassword) {
            console.log('⚠️  Admin credentials not set in .env file');
            console.log('   To create admin user, add ADMIN_EMAIL and ADMIN_PASSWORD to .env');
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
            console.log('⚠️  Remember to change these credentials after first login!');
        } else {
            console.log('✅ Admin user already exists with email:', adminEmail);
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
}

// Create admin user after database connection
mongoose.connection.once('open', () => {
    createAdminUser();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// Verify token endpoint
app.get('/api/verify-token', authenticateToken, async (req, res) => {
  try {
    // If authenticateToken passes, token is valid
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
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
});