// All dummy data — mirrored from the web frontend's local seed db (src/utils/db.js).
// No backend / no real database. Mock login credentials are the same as the web app.

export const USERS = [
  {
    id: 'u1', name: 'Dr. Emily Chen', role: 'mentor',
    email: 'mentor@prolign.com', password: 'mentor123',
    title: 'Senior AI Researcher', company: 'TechNexus', industry: 'Artificial Intelligence',
    skills: ['Machine Learning', 'Python', 'Data Science', 'Deep Learning'],
    rating: 4.9, reviews: 124, hourlyRate: 150,
    availability: ['Monday 10:00 AM', 'Wednesday 2:00 PM'],
    bio: 'Passionate about AI ethics and mentoring the next generation of data scientists.',
    status: 'approved', createdAt: '2021-07-12T10:00:00Z',
  },
  {
    id: 'u2', name: 'James Wilson', role: 'mentor',
    title: 'VP of Engineering', company: 'CloudScale', industry: 'Software Engineering',
    skills: ['System Design', 'Leadership', 'Cloud Architecture'],
    rating: 4.7, reviews: 89, hourlyRate: 200,
    availability: ['Tuesday 4:00 PM', 'Friday 9:00 AM'],
    bio: '15+ years of experience scaling engineering teams from 10 to 500+.',
    status: 'approved', createdAt: '2020-03-12T10:00:00Z',
  },
  {
    id: 'u3', name: 'Michael Chang', role: 'mentor',
    title: 'Senior Product Manager', company: 'InnovateTech', industry: 'Product Management',
    skills: ['Agile', 'Product Strategy', 'Roadmapping'],
    rating: 4.8, reviews: 54, hourlyRate: 120,
    availability: ['Monday 1:00 PM', 'Thursday 10:00 AM'],
    bio: 'Helping engineers transition into product management.',
    status: 'approved', experience: 8, createdAt: '2022-09-18T10:00:00Z',
  },
  {
    id: 'u4', name: 'Aisha Patel', role: 'mentor',
    title: 'Data Scientist', company: 'DataCorp', industry: 'Artificial Intelligence',
    skills: ['Python', 'SQL', 'Machine Learning'],
    rating: 4.5, reviews: 32, hourlyRate: 90,
    availability: ['Wednesday 9:00 AM'],
    bio: 'Passionate about data-driven decision making.',
    status: 'approved', experience: 4, createdAt: '2023-11-02T10:00:00Z',
  },
  {
    id: 'u5', name: 'David Reynolds', role: 'mentor',
    title: 'Frontend Developer', company: 'WebWorks', industry: 'Software Engineering',
    skills: ['React', 'CSS', 'TypeScript'],
    rating: 3.9, reviews: 12, hourlyRate: 60,
    availability: ['Friday 2:00 PM'],
    bio: 'Self-taught developer eager to help beginners.',
    status: 'approved', experience: 2, createdAt: '2024-01-21T10:00:00Z',
  },
  {
    id: 'u6', name: 'Sarah Chen', role: 'mentor',
    title: 'Design Lead', company: 'Linear', industry: 'Design',
    skills: ['UX/UI', 'Figma', 'Design Systems'],
    rating: 5.0, reviews: 200, hourlyRate: 180,
    availability: ['Tuesday 11:00 AM', 'Thursday 3:00 PM'],
    bio: 'Designing the future of productivity software.',
    status: 'approved', experience: 12, createdAt: '2014-03-09T10:00:00Z',
  },
  {
    id: 'u7', name: 'Sarah Drasner', role: 'mentor',
    title: 'VP Developer Experience', company: 'Netlify', industry: 'Software Engineering',
    skills: ['Vue', 'JavaScript', 'Architecture'],
    rating: 0, reviews: 0, hourlyRate: 160,
    availability: ['Monday 10:00 AM'],
    bio: 'Helping developers build better experiences.',
    status: 'pending', experience: 15, createdAt: '2026-05-26T10:00:00Z',
  },
  {
    id: 'u8', name: 'Marcus Holloway', role: 'mentor',
    title: 'Security Consultant', company: 'DedSec', industry: 'Cybersecurity',
    skills: ['Penetration Testing', 'Network Security'],
    rating: 0, reviews: 0, hourlyRate: 110,
    availability: ['Tuesday 2:00 PM'],
    bio: 'Securing the future, one system at a time.',
    status: 'pending', experience: 6, createdAt: '2026-06-05T10:00:00Z',
  },
  {
    id: 'mentee1', name: 'Sarah Jenkins', role: 'mentee',
    email: 'mentee@prolign.com', password: 'mentee123',
    title: 'Computer Science Student', skills: ['JavaScript', 'React'],
    createdAt: '2025-10-14T10:00:00Z',
  },
  {
    id: 'mentee2', name: 'Alex Johnson', role: 'mentee',
    title: 'Aspiring Product Manager', skills: ['Data Analysis', 'Communication'],
    createdAt: '2026-02-17T10:00:00Z',
  },
  {
    id: 'admin1', name: 'System Admin', role: 'admin',
    email: 'admin@prolign.com', password: 'password123',
    createdAt: '2025-06-01T10:00:00Z',
  },
];

export const SESSIONS = [
  { id: 's1', menteeId: 'mentee1', mentorId: 'u6', dateTime: 'Oct 24, 2026', time: '10:00 AM — 11:00 AM', type: 'Design Strategy', status: 'Confirmed' },
  { id: 's2', menteeId: 'mentee1', mentorId: 'u2', dateTime: 'Oct 26, 2026', time: '02:00 PM — 03:00 PM', type: 'System Design', status: 'Confirmed' },
  { id: 's3', menteeId: 'mentee1', mentorId: 'u1', dateTime: 'Nov 02, 2026', time: '09:00 AM — 10:00 AM', type: 'AI Interview Prep', status: 'Pending' },
  { id: 's4', menteeId: 'mentee1', mentorId: 'u4', dateTime: 'Sep 12, 2026', time: '01:00 PM — 02:00 PM', type: 'Portfolio Review', status: 'Cancelled' },
  { id: 's5', menteeId: 'mentee2', mentorId: 'u3', dateTime: 'Oct 28, 2026', time: '11:00 AM — 12:00 PM', type: 'Product Strategy', status: 'Confirmed' },
  { id: 's6', menteeId: 'mentee1', mentorId: 'u6', dateTime: 'Aug 30, 2026', time: '03:00 PM — 04:00 PM', type: 'Design Review', status: 'Completed' },
];

export const BOOKINGS = [
  { id: 'b1', menteeId: 'mentee1', mentorId: 'u1', date: '2026-06-15', time: '10:00 AM', status: 'scheduled', paymentStatus: 'paid', amount: 150 },
  { id: 'b2', menteeId: 'mentee1', mentorId: 'u6', date: '2026-06-10', time: '02:00 PM', status: 'Completed', paymentStatus: 'paid', amount: 180 },
  { id: 'b3', menteeId: 'mentee2', mentorId: 'u3', date: '2026-06-22', time: '11:00 AM', status: 'scheduled', paymentStatus: 'paid', amount: 120 },
];

export const REVIEWS = {
  u1: [
    { id: 'r1', author: 'Sarah Jenkins', rating: 5, text: 'Emily broke down complex ML concepts so clearly. Best session I have had.', date: 'May 2026' },
    { id: 'r2', author: 'Alex Johnson', rating: 5, text: 'Incredible depth on data science career paths. Highly recommended.', date: 'Apr 2026' },
  ],
  u6: [
    { id: 'r3', author: 'Sarah Jenkins', rating: 5, text: 'Sarah\u2019s design feedback was sharp and actionable. Loved it.', date: 'Jun 2026' },
  ],
  u2: [
    { id: 'r4', author: 'Alex Johnson', rating: 5, text: 'James helped me ace my system design interview.', date: 'May 2026' },
  ],
};

export const TESTIMONIALS = [
  { id: 't1', name: 'David K.', role: 'Frontend Engineer', company: 'TechNova', quote: 'ProLign transformed my career. The insights I got on system design directly led to my promotion to Senior Engineer.' },
  { id: 't2', name: 'Elena R.', role: 'Product Manager', company: 'Innovate Inc.', quote: 'My mentor helped me navigate the transition from engineering to product management seamlessly. The flexible scheduling was a lifesaver.' },
  { id: 't3', name: 'Marcus T.', role: 'Data Scientist', company: 'Analytix Labs', quote: 'The AI matching was spot-on. My mentor\u2019s guidance saved me months of trial and error. I landed my dream role within weeks.' },
];

export const NOTIFICATIONS = [
  { id: 'n1', title: 'New Mentor Application', message: 'Sarah Drasner has applied to be a mentor.', read: false, type: 'alert' },
  { id: 'n2', title: 'Payment Received', message: '$150 received from Sarah Jenkins.', read: false, type: 'success' },
];

// ---- helpers ----
export const getUsersByRole = (role) => USERS.filter((u) => u.role === role);
export const getUserById = (id) => USERS.find((u) => u.id === id);
export const getApprovedMentors = () => USERS.filter((u) => u.role === 'mentor' && u.status === 'approved');
export const getPendingMentors = () => USERS.filter((u) => u.role === 'mentor' && u.status === 'pending');
export const getSessionsForUser = (userId, role) =>
  SESSIONS.filter((s) => (role === 'mentor' ? s.mentorId === userId : s.menteeId === userId));
export const getReviewsForMentor = (mentorId) => REVIEWS[mentorId] || [];

export const EXPERTISE_OPTIONS = [
  'All', 'Software Engineering', 'Artificial Intelligence', 'Product Management',
  'Design', 'Cybersecurity', 'Data Science',
];

// Mentor level — computed from registration date (mirrors utils/mentorLevel.js)
export function getMentorLevel(mentor) {
  const raw = mentor?.createdAt;
  if (!raw) return { level: null, label: 'Experience Level Unavailable', yearsDisplay: '' };
  const registered = new Date(raw);
  const diffYears = (Date.now() - registered.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  let level, label;
  if (diffYears <= 1) { level = 'junior'; label = 'Junior Mentor'; }
  else if (diffYears <= 3) { level = 'intermediate'; label = 'Intermediate Mentor'; }
  else { level = 'senior'; label = 'Senior Mentor'; }
  const yrs = Math.floor(diffYears);
  const yearsDisplay = yrs < 1 ? 'Less than a year' : `${yrs} year${yrs !== 1 ? 's' : ''}`;
  return { level, label, yearsDisplay };
}
