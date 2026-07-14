const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'super-secret-jit-key'; // In production, use environment variables!

// Hardcoded credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve admin panel static files FIRST (login, dashboard, editor pages)
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main website files from the root (one level up)
// This makes website pages accessible at localhost:3000/index.html, /about-jit.html etc.
app.use('/site', express.static(path.join(__dirname, '../')));

// Root directory for HTML files (one level up from admin-server)
const SITE_ROOT = path.join(__dirname, '../');

// Assets directory where uploaded images will be saved
const ASSETS_DIR = path.join(SITE_ROOT, 'assets');

// Multer storage config — saves files to assets/ with original extension
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure assets folder exists
        if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
        cb(null, ASSETS_DIR);
    },
    filename: (req, file, cb) => {
        // Create unique filename: timestamp + original name (sanitized)
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const unique = Date.now() + '-' + sanitized;
        cb(null, unique);
    }
});

// Only allow image file types
const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpg, png, gif, webp, svg)'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB max
});

// Authentication middleware
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (err) return res.status(403).json({ error: 'Invalid token' });
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// API: Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// API: List all HTML files
app.get('/api/files', authenticateJWT, (req, res) => {
    fs.readdir(SITE_ROOT, (err, files) => {
        if (err) return res.status(500).json({ error: 'Failed to read directory' });
        
        const htmlFiles = files.filter(file => file.endsWith('.html'));
        res.json({ files: htmlFiles });
    });
});

// API: Upload image to assets/ folder
app.post('/api/upload', authenticateJWT, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the public URL path that the website can use
    const publicUrl = 'assets/' + req.file.filename;
    res.json({
        data: [{ src: publicUrl, name: req.file.originalname }]
    });
});

// API: List all uploaded images in assets/ folder
app.get('/api/assets', authenticateJWT, (req, res) => {
    fs.readdir(ASSETS_DIR, (err, files) => {
        if (err) return res.json({ data: [] });
        const imageExts = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
        const images = files
            .filter(f => imageExts.test(f))
            .map(f => ({ src: 'assets/' + f, name: f }));
        res.json({ data: images });
    });
});

// API: Get content of a specific HTML file
app.get('/api/file/:filename', authenticateJWT, (req, res) => {
    const filename = req.params.filename;
    
    // Security check to prevent path traversal
    if (filename.includes('/') || filename.includes('\\') || !filename.endsWith('.html')) {
        return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(SITE_ROOT, filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ content });
});

// API: Save modified HTML
app.post('/api/save', authenticateJWT, (req, res) => {
    const { filename, html, css } = req.body;
    
    if (!filename || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(SITE_ROOT, filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    try {
        const originalFile = fs.readFileSync(filePath, 'utf8');
        
        // Regex to extract everything up to <body ...>
        const match = originalFile.match(/^(.*?<body[^>]*>)/is);
        
        if (!match) {
            return res.status(500).json({ error: 'Could not parse original HTML structure' });
        }
        
        let headAndBodyTag = match[1];
        
        // Clean injected header/footer wrappers
        let cleanedHtml = html.replace(/(<div[^>]*id=["']header["'][^>]*>).*?(<\/div>)/is, '$1$2');
        cleanedHtml = cleanedHtml.replace(/(<div[^>]*id=["']footer["'][^>]*>).*?(<\/div>)/is, '$1$2');
        
        // Handle CSS injection
        if (css && css.trim() !== '') {
            const styleTag = `\n    <style id="gjs-custom-styles">\n${css}\n    </style>\n`;
            // Remove old styles if they exist
            headAndBodyTag = headAndBodyTag.replace(/<style id="gjs-custom-styles">.*?<\/style>/is, '');
            // Inject new styles right before </head>
            headAndBodyTag = headAndBodyTag.replace('</head>', styleTag + '</head>');
        }
        
        const finalContent = `${headAndBodyTag}\n${cleanedHtml}\n</body>\n</html>`;
        
        fs.writeFileSync(filePath, finalContent, 'utf8');
        res.json({ success: true });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save file' });
    }
});

// Fallback to serve the dashboard for any other GET requests (SPA routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Admin panel server running at http://localhost:${PORT}`);
});
