require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { processBusinessCard } = require('./openai');

const app = express();
const port = process.env.PORT || 3000;

// Set up storage for uploaded files
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve static files from public directory
app.use(express.static('public'));
app.use(express.json());

// API endpoint to process business card image
app.post('/api/process-card', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        const imageBuffer = req.file.buffer;
        const base64Image = imageBuffer.toString('base64');
        
        // Process the image with OpenAI
        const result = await processBusinessCard(base64Image);
        
        return res.json(result);
    } catch (error) {
        console.error('Error processing business card:', error);
        return res.status(500).json({ error: 'Failed to process business card', details: error.message });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`Access locally via: http://localhost:${port}`);
    console.log(`Access from other devices on your network using your computer's IP address and port ${port}`);
});
