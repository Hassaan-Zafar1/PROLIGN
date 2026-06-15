/**
 * Mock Data for MentorBridge Application
 * This data simulates API responses from MongoDB
 * 
 * TODO: Replace with actual API calls to backend endpoints when available:
 * - GET /api/features
 * - GET /api/testimonials
 * - POST /api/auth/login
 * - POST /api/auth/register-mentee
 * - POST /api/auth/register-mentor
 */

// Features for the landing page
export const FEATURES = [
  {
    id: 1,
    icon: "psychology",
    title: "AI Matching",
    description: "Our intelligent algorithm analyzes your career path and aspirations to find the perfect professional counterpart."
  },
  {
    id: 2,
    icon: "video_chat",
    title: "Video Sessions",
    description: "High-definition integrated video calls with automated scheduling, note-taking, and resource sharing features."
  },
  {
    id: 3,
    icon: "explore",
    title: "Career Guidance",
    description: "Receive personalized roadmaps, interview preparation, and portfolio reviews from veterans in your chosen industry."
  }
];

// Steps for the "How It Works" section
export const STEPS = [
  {
    id: 1,
    title: "Register",
    description: "Create your professional profile in minutes."
  },
  {
    id: 2,
    title: "AI Interview",
    description: "Share your goals with our virtual analyst."
  },
  {
    id: 3,
    title: "Get Matched",
    description: "Review top-tier mentor recommendations."
  },
  {
    id: 4,
    title: "Book Session",
    description: "Begin your journey with your first 1-on-1."
  }
];

// Testimonials
export const TESTIMONIALS = [
  {
    id: 1,
    quote: "The matching process was surprisingly accurate. Within two weeks, I was working with a Senior VP from a Fortune 500 company who helped me navigate my transition into leadership.",
    author: "Sarah Chen",
    role: "Design Lead at Linear",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDjVrx9Cxguoad9i0ULYY2eleT8-irgu7FljCR0I032J4gd5dgKtQ-7GYob21aE-M1Z3uqe1yeANcDTkjSXMdfQKKxVkq4FBliQUvAha63yv0B4Y8KmUd-B7eaSAMstz0-7-OOqe-2yUthJ8xTSmR3gOq6z2LcpEfZjSyEjgeiMOPRSKZqd1pZEMCrUEmblZxc-V381AfJjOmhJ76rVWP20xhGiupxkACKDyQEVPhiAQN_YX8QdlxYpetIPN8nx7MOQVF3ctEZbQuQM"
  },
  {
    id: 2,
    quote: "Being a mentor on MentorBridge has been incredibly rewarding. The platform handles all the logistics, allowing me to focus entirely on helping the next generation of engineers.",
    author: "James Wilson",
    role: "Principal Engineer at Scale",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD6TEJtVW8fGmdo9E0LCciPjdRVjBD5YWm2a0GbrkU_M2RWla7boQ4_8thieEoqGoJnuglF6eS8GzM4iD7_e4hcGI9aq0tDXbVyZAge-qlw4GsLjkquTS9nx7XGgpIg19uu7FtfQBCbSgK9NtRC8uhvZDmKmcGeXoZGM0v9V98FO8JnPpg3PnSBDLh7y8hPyQodwA0qFEgmOaHTqO4TsJ5jTWMHsp7VEClY1JSuRthp0x0WQNSTEkKXAcSYX_Y5zprc4NSvo_d5NkNK"
  }
];

/**
 * User Authentication Mock Data
 * TODO: Replace with actual API POST request to /api/auth/login
 * Expected request body: { email, password }
 * Expected response: { token, user: { id, email, role, name } }
 */
export const MOCK_USERS = [
  {
    id: "user_1",
    email: "mentee@example.com",
    password: "password123", // In production, never store plain passwords
    role: "mentee",
    name: "John Doe",
    token: "mock_token_mentee_12345"
  },
  {
    id: "user_2",
    email: "mentor@example.com",
    password: "password123",
    role: "mentor",
    name: "Dr. Julian Thorne",
    token: "mock_token_mentor_12345"
  },
  {
    id: "user_3",
    email: "admin@example.com",
    password: "password123",
    role: "admin",
    name: "Admin User",
    token: "mock_token_admin_12345"
  }
];

/**
 * Mentee Profile Mock Data
 * TODO: Replace with API POST to /api/mentees/register
 * TODO: Replace with API GET to /api/mentees/:id
 */
export const MENTEE_PROFILE_TEMPLATE = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  careerGoals: "",
  industry: "",
  experience: "junior",
  skills: [],
  availability: [],
  budget: 0
};

/**
 * Mentor Profile Mock Data
 * TODO: Replace with API POST to /api/mentors/register
 * TODO: Replace with API GET to /api/mentors/:id
 */
export const MENTOR_PROFILE_TEMPLATE = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  linkedinUrl: "",
  cvFile: null,
  expertise: [],
  yearsOfExperience: 1,
  hourlyRate: 0,
  bio: "",
  availability: []
};

/**
 * Expertise/Skills options for mentors
 * TODO: Fetch from API GET /api/expertise-tags
 */
export const EXPERTISE_OPTIONS = [
  "Product Management",
  "UI Design",
  "UX Design",
  "Full Stack Development",
  "Frontend Development",
  "Backend Development",
  "Data Science",
  "Machine Learning",
  "DevOps",
  "Strategy",
  "Marketing",
  "Sales",
  "Leadership",
  "Finance",
  "Entrepreneurship"
];

/**
 * Industries for mentee registration
 * TODO: Fetch from API GET /api/industries
 */
export const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Marketing",
  "Design",
  "Education",
  "Consulting",
  "E-commerce",
  "Startups",
  "Non-profit"
];

/**
 * Experience levels for mentees
 * TODO: Fetch from API GET /api/experience-levels
 */
export const EXPERIENCE_LEVELS = [
  { value: "student", label: "Student" },
  { value: "junior", label: "Junior (0-2 years)" },
  { value: "mid", label: "Mid-Level (2-5 years)" },
  { value: "senior", label: "Senior (5+ years)" },
  { value: "director", label: "Director/Lead" }
];
