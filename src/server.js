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
        // Check if an image was uploaded
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No image file uploaded',
                details: 'Please upload a business card image'
            });
        }

        // Check file size (limit to 5MB to avoid unnecessary large uploads)
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        if (req.file.size > MAX_FILE_SIZE) {
            return res.status(413).json({
                error: 'Image file too large',
                details: 'Please upload an image smaller than 5MB'
            });
        }

        // Check file type
        const validMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
        if (!validMimeTypes.includes(req.file.mimetype)) {
            return res.status(415).json({
                error: 'Invalid file type',
                details: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)'
            });
        }

        const imageBuffer = req.file.buffer;
        const base64Image = imageBuffer.toString('base64');
        
        // Process the image with OpenAI
        const result = await processBusinessCard(base64Image);
        
        return res.json(result);
    } catch (error) {
        console.error('Error processing business card:', error);
        
        // Determine appropriate status code based on error type
        let statusCode = 500;
        
        if (error.message.includes('API key') || error.message.includes('Authentication')) {
            statusCode = 401; // Unauthorized
        } else if (error.message.includes('rate limit')) {
            statusCode = 429; // Too Many Requests
        } else if (error.message.includes('violates usage policies')) {
            statusCode = 422; // Unprocessable Entity
        }
        
        return res.status(statusCode).json({ 
            error: 'Failed to process business card', 
            details: error.message 
        });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`Access locally via: http://localhost:${port}`);
    console.log(`Access from other devices on your network using your computer's IP address and port ${port}`);
});
