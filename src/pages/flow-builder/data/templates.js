// C:\Projects\WhatsAppBot_Rocket\src\pages\flow-builder\data\templates.js

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'Explore All', icon: 'Grid' },
  { id: 'welcome', label: 'Onboarding', icon: 'Hand' },
  { id: 'support', label: 'Customer Support', icon: 'Headphones' },
  { id: 'sales', label: 'Sales & Marketing', icon: 'TrendingUp' },
  { id: 'booking', label: 'Appointments', icon: 'Calendar' },
  { id: 'utility', label: 'Utilities', icon: 'Settings' }
];

export const FLOW_TEMPLATES = [
  // --- WELCOME ---
  {
    id: 1,
    name: 'Welcome & Menu',
    description: 'The perfect starting point. Greets users and offers a main menu of options.',
    category: 'welcome',
    triggerType: 'welcome',
    complexity: 'Basic',
    steps: 1,
    tags: ['Popular', 'Essential'],
    keywords: [],
    responses: [
      {
        message: `Hello! 👋 Welcome to [Business Name].\n\nHow can we help you today?\n\n1️⃣ View Products\n2️⃣ Track Order\n3️⃣ Talk to Support\n\nReply with the number of your choice.`,
        delay: 0
      }
    ]
  },
  {
    id: 101,
    name: 'Out of Office Greeting',
    description: 'Auto-reply for new users contacting outside business hours.',
    category: 'welcome',
    triggerType: 'welcome',
    complexity: 'Basic',
    steps: 1,
    tags: [],
    keywords: [],
    responses: [{ message: `Thanks for messaging us! We are currently closed 🌙.\n\nWe will be back tomorrow at 9 AM. Leave your query here and we'll get back to you ASAP!`, delay: 0 }],
    isActive: true,
    popularity: 85
  },

  // --- SUPPORT ---
  {
    id: 2,
    name: 'Business Hours FAQ',
    description: 'Instantly share your operating hours.',
    category: 'support',
    triggerType: 'keyword',
    complexity: 'Basic',
    steps: 1,
    tags: [],
    keywords: ['hours', 'open', 'time', 'closed'],
    responses: [{ message: `🕒 Our business hours are:\n\nMon-Fri: 9:00 AM - 6:00 PM\nSat: 10:00 AM - 2:00 PM\nSun: Closed`, delay: 0 }],
    isActive: true,
    popularity: 88
  },
  {
    id: 3,
    name: 'Order Tracking Assistant',
    description: 'Guide users to track their orders.',
    category: 'support',
    triggerType: 'keyword',
    complexity: 'Intermediate',
    steps: 2,
    tags: ['Essential'],
    keywords: ['order', 'track', 'status', 'shipping'],
    responses: [
      { message: `📦 Let's check your order. Please reply with your Order ID (starts with #).`, delay: 0 },
      { message: `Thanks! checking our system... 🔍`, delay: 2 }
    ],
    isActive: true,
    popularity: 92
  },
  {
    id: 6,
    name: 'Contact Info Share',
    description: 'Send location, email, and phone details.',
    category: 'support',
    triggerType: 'keyword',
    complexity: 'Basic',
    steps: 1,
    tags: [],
    keywords: ['contact', 'address', 'location', 'email'],
    responses: [{ message: `📍 Visit us at:\n123 Main St, City Center\n\n📧 Email: support@business.com\n📞 Phone: +1 234 567 890`, delay: 0 }],
    isActive: true,
    popularity: 90
  },
  {
    id: 8,
    name: 'General FAQ',
    description: 'Answer common questions about returns and shipping.',
    category: 'support',
    triggerType: 'keyword',
    complexity: 'Intermediate',
    steps: 1,
    tags: [],
    keywords: ['faq', 'help', 'return', 'shipping'],
    responses: [{ message: `❓ FAQ:\n\nReturns: 30-day money back guarantee.\nShipping: Free on orders over $50.\n\nNeed more help? Type "Agent" to chat with a human.`, delay: 0 }],
    isActive: true,
    popularity: 87
  },

  // --- SALES ---
  {
    id: 4,
    name: 'Product Catalog',
    description: 'Showcase product categories to interested users.',
    category: 'sales',
    triggerType: 'keyword',
    complexity: 'Intermediate',
    steps: 1,
    tags: ['Sales'],
    keywords: ['products', 'catalog', 'buy', 'shop'],
    responses: [{ message: `🛍️ Check out our latest collections:\n\n1. Electronics 📱\n2. Fashion 👗\n3. Home Decor 🏠\n\nReply with the category name to see more!`, delay: 0 }],
    isActive: true,
    popularity: 85
  },
  {
    id: 7,
    name: 'Flash Sale Promo',
    description: 'Urgent discount message for marketing campaigns.',
    category: 'sales',
    triggerType: 'keyword',
    complexity: 'Basic',
    steps: 1,
    tags: ['Marketing'],
    keywords: ['sale', 'promo', 'discount', 'offer'],
    responses: [{ message: `🔥 FLASH SALE ALERT!\n\nGet 50% OFF everything for the next 24h.\nUse code: FLASH50 at checkout.\n\nShop now: www.mystore.com`, delay: 0 }],
    isActive: true,
    popularity: 82
  },
  {
    id: 401,
    name: 'Lead Qualification',
    description: 'Ask key questions to qualify potential leads.',
    category: 'sales',
    triggerType: 'keyword',
    complexity: 'Advanced',
    steps: 3,
    tags: ['Lead Gen'],
    keywords: ['quote', 'pricing', 'service'],
    responses: [
       { message: `Hi! We'd love to help. What is your estimated budget for this project?`, delay: 0 },
       { message: `Got it. And what is your timeline?`, delay: 0 },
       { message: `Thanks! An agent will review this and contact you shortly.`, delay: 0 }
    ],
    isActive: true,
    popularity: 75
  },

  // --- BOOKING ---
  {
    id: 5,
    name: 'Appointment Scheduler',
    description: 'Help customers book a meeting slot.',
    category: 'booking',
    triggerType: 'keyword',
    complexity: 'Intermediate',
    steps: 2,
    tags: [],
    keywords: ['book', 'appointment', 'schedule', 'meeting'],
    responses: [
       { message: `📅 I can help you book a slot. Please tell me your preferred day (e.g., "Monday").`, delay: 0 },
       { message: `Checking availability for that day...`, delay: 2 }
    ],
    isActive: true,
    popularity: 78
  },

  // --- UTILITY ---
  {
    id: 901,
    name: 'Feedback Survey (NPS)',
    description: 'Collect customer feedback after a service.',
    category: 'utility',
    triggerType: 'keyword',
    complexity: 'Basic',
    steps: 1,
    tags: ['Feedback'],
    keywords: ['feedback', 'rate', 'review'],
    responses: [{ message: `How would you rate our service today from 1 to 5? (5 being excellent) ⭐`, delay: 0 }],
    isActive: true,
    popularity: 80
  }
];