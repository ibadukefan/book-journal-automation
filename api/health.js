const BookEmailAutomation = require('../book-email-automation');

// Initialize email automation (singleton pattern for serverless)
let emailAutomation;

function getEmailAutomation() {
  if (!emailAutomation) {
    emailAutomation = new BookEmailAutomation();
    emailAutomation.start();
  }
  return emailAutomation;
}

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const automation = getEmailAutomation();
    
    res.json({ 
      status: 'healthy', 
      automation: 'running',
      stats: automation.getStats(),
      timestamp: new Date().toISOString(),
      platform: 'vercel'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
}