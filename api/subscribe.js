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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    const automation = getEmailAutomation();
    const subscriberId = await automation.subscribe(email, name);
    
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
}