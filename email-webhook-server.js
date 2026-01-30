#!/usr/bin/env node

/**
 * Email Webhook Server for Journal Prompts Lead Magnet
 * 
 * This server receives form submissions from the landing page
 * and triggers the automated email sequence.
 */

const express = require('express');
const cors = require('cors');
const BookEmailAutomation = require('./book-email-automation');

const app = express();
const port = process.env.PORT || 3004;

// Initialize email automation
const emailAutomation = new BookEmailAutomation();
emailAutomation.start();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        automation: 'running',
        stats: emailAutomation.getStats(),
        timestamp: new Date().toISOString()
    });
});

// Form submission endpoint - replaces Formspree
app.post('/subscribe', async (req, res) => {
    try {
        const { name, email } = req.body;
        
        // Validate input
        if (!name || !email) {
            return res.status(400).json({ 
                error: 'Name and email are required',
                received: { name, email }
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                error: 'Invalid email format',
                email: email
            });
        }

        // Subscribe to email automation
        const subscriberId = await emailAutomation.subscribe(email, name);
        
        console.log(`✅ New subscriber: ${name} (${email}) - ID: ${subscriberId}`);
        
        // Success response for AJAX form
        res.json({
            success: true,
            message: 'Successfully subscribed to journal prompts!',
            subscriberId: subscriberId,
            nextStep: 'Check your email for your free prompts'
        });

    } catch (error) {
        console.error('❌ Subscription error:', error);
        res.status(500).json({ 
            error: 'Failed to process subscription',
            message: 'Please try again or contact support'
        });
    }
});

// Analytics endpoint
app.get('/stats', (req, res) => {
    res.json({
        automation: emailAutomation.getStats(),
        server: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        }
    });
});

// Test email endpoint (for development)
app.post('/test-email', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Test endpoint disabled in production' });
    }
    
    try {
        const { email = 'test@example.com', name = 'Test User' } = req.body;
        const subscriberId = await emailAutomation.subscribe(email, name);
        
        res.json({
            success: true,
            message: 'Test subscription created',
            subscriberId: subscriberId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`\n🚀 Email Webhook Server running on port ${port}`);
    console.log(`📧 Email automation is active and processing`);
    console.log(`🌐 Form endpoint: http://localhost:${port}/subscribe`);
    console.log(`📊 Stats endpoint: http://localhost:${port}/stats`);
    console.log(`🔍 Health check: http://localhost:${port}/health\n`);
    
    console.log('📝 INTEGRATION STEPS:');
    console.log('1. Update landing page form action to point to /subscribe endpoint');
    console.log('2. Test form submission works correctly');
    console.log('3. Deploy this server to production');
    console.log('4. Update DNS/domain settings if needed\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⏹️  Shutting down email automation server...');
    emailAutomation.stop();
    process.exit(0);
});

module.exports = app;