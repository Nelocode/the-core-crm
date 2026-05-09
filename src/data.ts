export const contacts: any[] = [
  {
    id: '1',
    name: 'Marcus Thorne',
    role: 'CEO',
    company: 'Thorne Industries',
    email: 'marcus@thorne.com',
    location: 'Zurich, Switzerland',
    avatar: '/avatars/marcus.png',
    family: {
      spouse: 'Elena',
      children: ['Sophia (8)', 'Leo (5)']
    },
    hobbies: ['Vintage Watches', 'Sailing', 'Quantum Computing'],
    interactions: [
      {
        id: 'int1',
        date: '2025-11-12T10:00:00Z',
        type: 'meeting',
        summary: 'Discussed the expansion of AR manufacturing in the DACH region. He was impressed by our "Copper Giant" prototypes.',
        location: 'Zurich',
        sentiment: 'positive'
      },
      {
        id: 'int2',
        date: '2025-10-12T14:00:00Z',
        type: 'call',
        summary: 'Initial outreach regarding the Forge Hub launch. Interested in strategic partnership.',
        sentiment: 'neutral'
      }
    ],
    relationshipScore: 88,
    notes: 'Very detail-oriented. Values personal trust over raw numbers. Mentioned Sophia started violin lessons recently.'
  },
  {
    id: '2',
    name: 'Sarah Jenkins',
    role: 'CTO',
    company: 'Nova Logic',
    email: 'sarah.j@novalogic.io',
    location: 'Austin, TX',
    avatar: '/avatars/sarah.png',
    hobbies: ['Rock Climbing', 'Modular Synths'],
    interactions: [
      {
        id: 'int3',
        date: '2026-03-15T15:30:00Z',
        type: 'call',
        summary: 'Technical deep dive into the integration of OpenClaw agents with their existing dashboard.',
        location: 'Remote',
        sentiment: 'positive'
      }
    ],
    relationshipScore: 72,
    notes: 'No-nonsense approach. Interested in scalability and low-latency deployments.'
  },
  {
    id: '3',
    name: 'Elara Voss',
    role: 'Creative Director',
    company: 'Voss Design Haus',
    email: 'elara@voss.design',
    location: 'Berlin, Germany',
    avatar: '/avatars/elara.png',
    hobbies: ['Abstract Painting', 'Minimalist Architecture'],
    interactions: [
      {
        id: 'int4',
        date: '2026-04-20T11:00:00Z',
        type: 'meeting',
        summary: 'Explored new branding concepts for The Core. She loved the Copper Giant aesthetic.',
        location: 'Berlin',
        sentiment: 'positive'
      }
    ],
    relationshipScore: 94,
    notes: 'Highly creative and visionary. Prefers visual communication over long emails.'
  }
];

export const meetings = [
  {
    id: 'm1',
    title: 'Strategic Partnership Deep Dive',
    startTime: '2026-04-28T09:00:00Z',
    endTime: '2026-04-28T10:30:00Z',
    attendees: ['1'],
    location: 'The Forge HQ (Room A1)',
    description: 'Finalizing the DACH region distribution agreement.',
    status: 'upcoming'
  },
  {
    id: 'm2',
    title: 'Branding Alignment Session',
    startTime: '2026-04-28T14:00:00Z',
    endTime: '2026-04-28T15:00:00Z',
    attendees: ['3'],
    location: 'Virtual Studio',
    description: 'Reviewing the new visual language for the AI dashboard.',
    status: 'upcoming'
  }
];

export const mockAIBriefings = {
  '1': {
    contactId: '1',
    icebreaker: "Hey Marcus, it's been a while since Zurich! How's Elena doing? I heard Sophia started violin lessons—she must be growing up so fast!",
    strategicContext: "Last time we met in Zurich, Marcus was specifically looking for stability in AR tracking. Reference the latest 'Copper Monitor' benchmarks to close the DACH deal.",
    emotionalPulse: 'positive'
  },
  '2': {
    contactId: '2',
    icebreaker: "Hi Sarah, how was the climbing trip to El Potrero Chico? Ready to dive into the OpenClaw latency metrics?",
    strategicContext: "Sarah is skeptical about cloud latency. Emphasize the local-first execution model of the new agency dashboard.",
    emotionalPulse: 'neutral'
  },
  '3': {
    contactId: '3',
    icebreaker: "Elara, your latest exhibit in Berlin was breathtaking. The way you use texture reminds me of our Copper aesthetic.",
    strategicContext: "Elara is the key to our visual identity. Ensure she feels ownership over the 'Core' design system to maintain long-term alignment.",
    emotionalPulse: 'positive'
  }
};


