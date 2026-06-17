import { getDefaultSiteContent, getStoredSiteContent, saveStoredSiteContent } from '../content/siteContent';

// Mock Database Initialization and Utility Functions using localStorage

const INITIAL_DATA = {
  users: [
    {
      id: "u1",
      name: "Dr. Emily Chen",
      role: "mentor",
      email: "mentor@mentorbridge.com",
      password: "mentor123",
      title: "Senior AI Researcher",
      company: "TechNexus",
      industry: "Artificial Intelligence",
      skills: ["Machine Learning", "Python", "Data Science", "Deep Learning"],
      rating: 4.9,
      reviews: 124,
      hourlyRate: 150,
      avatar: "https://i.pravatar.cc/150?u=emily",
      availability: ["Monday 10:00 AM", "Wednesday 2:00 PM"],
      bio: "Passionate about AI ethics and mentoring the next generation of data scientists.",
      status: "approved",
      createdAt: "2025-07-12T10:00:00Z"
    },
    {
      id: "u2",
      name: "James Wilson",
      role: "mentor",
      title: "VP of Engineering",
      company: "CloudScale",
      industry: "Software Engineering",
      skills: ["System Design", "Leadership", "Cloud Architecture"],
      rating: 4.7,
      reviews: 89,
      hourlyRate: 200,
      avatar: "https://i.pravatar.cc/150?u=james",
      availability: ["Tuesday 4:00 PM", "Friday 9:00 AM"],
      bio: "15+ years of experience scaling engineering teams from 10 to 500+.",
      status: "approved"
    },
    {
      id: "u3",
      name: "Michael Chang",
      role: "mentor",
      title: "Senior Product Manager",
      company: "InnovateTech",
      industry: "Product Management",
      skills: ["Agile", "Product Strategy", "Roadmapping"],
      rating: 4.8,
      reviews: 54,
      hourlyRate: 120,
      avatar: "https://ui-avatars.com/api/?name=Michael+Chang",
      availability: ["Monday 1:00 PM", "Thursday 10:00 AM"],
      bio: "Helping engineers transition into product management.",
      status: "approved",
      experience: 8,
      createdAt: "2025-09-18T10:00:00Z"
    },
    {
      id: "u4",
      name: "Aisha Patel",
      role: "mentor",
      title: "Data Scientist",
      company: "DataCorp",
      industry: "Artificial Intelligence",
      skills: ["Python", "SQL", "Machine Learning"],
      rating: 4.5,
      reviews: 32,
      hourlyRate: 90,
      avatar: "https://ui-avatars.com/api/?name=Aisha+Patel",
      availability: ["Wednesday 9:00 AM"],
      bio: "Passionate about data-driven decision making.",
      status: "approved",
      experience: 4,
      createdAt: "2025-11-02T10:00:00Z"
    },
    {
      id: "u5",
      name: "David Reynolds",
      role: "mentor",
      title: "Frontend Developer",
      company: "WebWorks",
      industry: "Software Engineering",
      skills: ["React", "CSS", "TypeScript"],
      rating: 3.9,
      reviews: 12,
      hourlyRate: 60,
      avatar: "https://ui-avatars.com/api/?name=David+Reynolds",
      availability: ["Friday 2:00 PM"],
      bio: "Self-taught developer eager to help beginners.",
      status: "approved",
      experience: 2,
      createdAt: "2026-01-21T10:00:00Z"
    },
    {
      id: "u6",
      name: "Sarah Chen",
      role: "mentor",
      title: "Design Lead",
      company: "Linear",
      industry: "Design",
      skills: ["UX/UI", "Figma", "Design Systems"],
      rating: 5.0,
      reviews: 200,
      hourlyRate: 180,
      avatar: "https://ui-avatars.com/api/?name=Sarah+Chen",
      availability: ["Tuesday 11:00 AM", "Thursday 3:00 PM"],
      bio: "Designing the future of productivity software.",
      status: "approved",
      experience: 12,
      createdAt: "2026-03-09T10:00:00Z"
    },
    {
      id: "u7",
      name: "Sarah Drasner",
      role: "mentor",
      title: "VP Developer Experience",
      company: "Netlify",
      industry: "Software Engineering",
      skills: ["Vue", "JavaScript", "Architecture"],
      rating: 0,
      reviews: 0,
      hourlyRate: 160,
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA8kOZXGI9DFRoAQ1yowFwvg1ZUM8R-4Kth7GdTi1EFeSyf1BAwV_ZmFZYNUC-Eckf_UI4LuF_2yPiLODRQduMk1yhJlUsDFNYvlTCRSprdkVkf5LHoLoNGNyaKpknZjd3VC1aKD22hmByp69c3ylT17ZVH0AwXvpyF7xciW8LvB7WaVVIqcIUP1peyIk4Tx12zJ8Ucy7KMqyLpfW0NfCg5xY52muCrI3XNRnvXKQbfJa03a1LEiuZ49jz75J9A6xeaNI8mPpUhPnDF",
      availability: ["Monday 10:00 AM"],
      bio: "Helping developers build better experiences.",
      status: "pending",
      experience: 15,
      createdAt: "2026-05-26T10:00:00Z"
    },
    {
      id: "u8",
      name: "Marcus Holloway",
      role: "mentor",
      title: "Security Consultant",
      company: "DedSec",
      industry: "Cybersecurity",
      skills: ["Penetration Testing", "Network Security"],
      rating: 0,
      reviews: 0,
      hourlyRate: 110,
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDqjMVAVdd9Rrlxlxpx494SqF-W1Vditgf-moZj4glvxMqEgyW3z7YA7hAR7Qbwb3W6ORthPn-Ak_R0-sq5BrJPwlhd4ICCkQaDsJ74d1QYJXjna2lwPAWRF1UDuizHH9oYVLoRAQhsnSPXMaaR28CL74tFvnmZlB2Qbd4UDEG7P-MYKgV6YlnHnfQqbtcM_dlPG5CxOnF3bhG0QCSkr1snMMH-fk4aEXbBNvmA-yXuEqlBBuwJUVBhJjvGzlpRSQNBNVPB5pXLgdx4",
      availability: ["Tuesday 2:00 PM"],
      bio: "Securing the future, one system at a time.",
      status: "pending",
      experience: 6,
      createdAt: "2026-06-05T10:00:00Z"
    },
    {
      id: "mentee1",
      name: "Sarah Jenkins",
      role: "mentee",
      email: "mentee@mentorbridge.com",
      password: "mentee123",
      title: "Computer Science Student",
      skills: ["JavaScript", "React"],
      avatar: "https://i.pravatar.cc/150?u=sarah",
      createdAt: "2025-10-14T10:00:00Z"
    },
    {
      id: "mentee2",
      name: "Alex Johnson",
      role: "mentee",
      title: "Aspiring Product Manager",
      skills: ["Data Analysis", "Communication"],
      avatar: "https://i.pravatar.cc/150?u=alex",
      createdAt: "2026-02-17T10:00:00Z"
    },
    {
      id: "admin1",
      name: "System Admin",
      role: "admin",
      email: "admin@mentorbridge.com",
      password: "password123",
      avatar: "https://i.pravatar.cc/150?u=admin",
      createdAt: "2025-06-01T10:00:00Z"
    }
  ],
  bookings: [
    {
      id: "b1",
      menteeId: "mentee1",
      mentorId: "u1",
      date: "2026-06-15",
      time: "10:00 AM",
      status: "scheduled",
      paymentStatus: "paid",
      amount: 150,
      createdAt: "2026-06-15T10:00:00Z"
    },
    {
      id: "b2",
      menteeId: "mentee1",
      mentorId: "u6",
      date: "2026-06-10",
      time: "02:00 PM",
      status: "Completed",
      paymentStatus: "paid",
      amount: 180,
      isRated: false,
      createdAt: "2026-06-10T14:00:00Z"
    }
  ],
  sessions: [
    {
      id: "s1",
      menteeId: "mentee1",
      mentorId: "u6",
      dateTime: "Oct 24, 2024",
      time: "10:00 AM — 11:00 AM",
      type: "Design Strategy",
      status: "Confirmed",
      isRated: false
    },
    {
      id: "s2",
      menteeId: "mentee1",
      mentorId: "u2",
      dateTime: "Oct 26, 2024",
      time: "02:30 PM — 03:30 PM",
      type: "System Architecture",
      status: "Completed",
      isRated: false
    },
    {
      id: "s3",
      menteeId: "mentee1",
      mentorId: "u1",
      dateTime: "Nov 02, 2026",
      time: "09:00 AM â€” 10:00 AM",
      type: "AI Interview Prep",
      status: "Pending",
      isRated: false
    },
    {
      id: "s4",
      menteeId: "mentee1",
      mentorId: "u4",
      dateTime: "Sep 12, 2026",
      time: "01:00 PM â€” 02:00 PM",
      type: "Portfolio Review",
      status: "Cancelled",
      isRated: false
    }
  ],
  reviews: [],
  notifications: [
    {
      id: "n1",
      title: "New Mentor Application",
      message: "Sarah Drasner has applied to be a mentor.",
      timestamp: "2026-06-12T16:30:00Z",
      read: false,
      type: "alert"
    },
    {
      id: "n2",
      title: "Payment Received",
      message: "$150 received from Sarah Jenkins.",
      timestamp: "2026-06-12T10:15:00Z",
      read: false,
      type: "success"
    }
  ],
  testimonials: [
    {
      id: "t1",
      name: "David K.",
      role: "Frontend Engineer",
      company: "TechNova",
      quote: "MentorBridge transformed my career. The insights I got on system design directly led to my promotion to Senior Engineer.",
      avatar: "https://i.pravatar.cc/150?u=david",
      published: true
    },
    {
      id: "t2",
      name: "Elena R.",
      role: "Product Manager",
      company: "Innovate Inc.",
      quote: "My mentor helped me navigate the transition from engineering to product management seamlessly. The flexible scheduling was a lifesaver.",
      avatar: "https://i.pravatar.cc/150?u=elena",
      published: true
    }
  ],
  currentUser: null // Will store the ID of the currently logged in user
};

export const initDB = () => {
  if (!localStorage.getItem("mentorBridgeDB")) {
    const initialDB = { ...INITIAL_DATA, siteContent: getStoredSiteContent() };
    localStorage.setItem("mentorBridgeDB", JSON.stringify(initialDB));
    saveStoredSiteContent(initialDB.siteContent);
  }
};

export const getDB = () => {
  const dbStr = localStorage.getItem("mentorBridgeDB");
  let db = dbStr ? JSON.parse(dbStr) : INITIAL_DATA;
  
  // Migration: ensure admin user exists in existing DBs
  if (!db.users.find(u => u.id === "admin1")) {
    const adminUser = INITIAL_DATA.users.find(u => u.id === "admin1");
    if (adminUser) db.users.push(adminUser);
    localStorage.setItem("mentorBridgeDB", JSON.stringify(db));
  }

  // Migration: ensure default seeded credentials stay valid
  const credentialSeeds = [
    { id: 'admin1', email: 'admin@mentorbridge.com', password: 'password123' },
    { id: 'u1', email: 'mentor@mentorbridge.com', password: 'mentor123' },
    { id: 'mentee1', email: 'mentee@mentorbridge.com', password: 'mentee123' },
  ];
  let credentialsUpdated = false;
  credentialSeeds.forEach((seed) => {
    const user = db.users.find((candidate) => candidate.id === seed.id);
    if (user && (user.email !== seed.email || user.password !== seed.password)) {
      user.email = seed.email;
      user.password = seed.password;
      credentialsUpdated = true;
    }
  });
  if (credentialsUpdated) {
    localStorage.setItem("mentorBridgeDB", JSON.stringify(db));
  }
  
  // Migration: ensure new mock mentors exist
  const newMentors = INITIAL_DATA.users.filter(u => u.role === 'mentor' && !db.users.find(existing => existing.id === u.id));
  if (newMentors.length > 0) {
    db.users.push(...newMentors);
    localStorage.setItem("mentorBridgeDB", JSON.stringify(db));
  }
  
  // Migration: ensure sessions exist
  if (!db.sessions) {
    db.sessions = INITIAL_DATA.sessions;
    localStorage.setItem("mentorBridgeDB", JSON.stringify(db));
  }
  const missingSessions = INITIAL_DATA.sessions.filter(
    (session) => !db.sessions.find((existingSession) => existingSession.id === session.id)
  );
  if (missingSessions.length > 0) {
    db.sessions.push(...missingSessions);
    localStorage.setItem("mentorBridgeDB", JSON.stringify(db));
  }

  if (!db.bookings) {
    db.bookings = INITIAL_DATA.bookings;
    localStorage.setItem("mentorBridgeDB", JSON.stringify(db));
  }

  const newBookings = INITIAL_DATA.bookings.filter(
    (booking) => !db.bookings.find((existingBooking) => existingBooking.id === booking.id)
  );
  if (newBookings.length > 0) {
    db.bookings.push(...newBookings);
    localStorage.setItem("mentorBridgeDB", JSON.stringify(db));
  }

  if (!db.reviews) {
    db.reviews = INITIAL_DATA.reviews;
    localStorage.setItem("mentorBridgeDB", JSON.stringify(db));
  }
  
  // Migration: ensure notifications exist
  if (!db.notifications) {
    db.notifications = INITIAL_DATA.notifications;
    localStorage.setItem("mentorBridgeDB", JSON.stringify(db));
  }
  
  // Migration: ensure testimonials exist
  if (!db.testimonials) {
    db.testimonials = INITIAL_DATA.testimonials;
    localStorage.setItem("mentorBridgeDB", JSON.stringify(db));
  }

  if (!db.siteContent) {
    db.siteContent = getDefaultSiteContent();
    localStorage.setItem("mentorBridgeDB", JSON.stringify(db));
  }

  let metadataUpdated = false;
  const seenIds = new Set();
  db.users = db.users.map((user) => {
    if (seenIds.has(user.id)) {
      metadataUpdated = true;
      return { ...user, id: `${user.role || 'user'}-${Date.now()}-${Math.random().toString(16).slice(2)}` };
    }
    seenIds.add(user.id);
    return user;
  });

  db.users.forEach((user, index) => {
    if (!user.createdAt) {
      const monthOffset = index % 12;
      const day = String(4 + (index % 22)).padStart(2, '0');
      user.createdAt = `2025-${String(7 + monthOffset > 12 ? monthOffset - 5 : 7 + monthOffset).padStart(2, '0')}-${day}T10:00:00Z`;
      metadataUpdated = true;
    }
    if (!user.avatar) {
      user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`;
      metadataUpdated = true;
    }
  });

  (db.bookings || []).forEach((booking) => {
    if (!booking.createdAt) {
      booking.createdAt = `${booking.date || '2026-06-01'}T10:00:00Z`;
      metadataUpdated = true;
    }
  });

  if (metadataUpdated) {
    localStorage.setItem("mentorBridgeDB", JSON.stringify(db));
  }

  saveStoredSiteContent(db.siteContent);

  return db;
};

export const saveDB = (db) => {
  localStorage.setItem("mentorBridgeDB", JSON.stringify(db));
  saveStoredSiteContent(db.siteContent || getDefaultSiteContent());
};

// User Operations
export const login = (email, password) => {
  const db = getDB();
  const user = db.users.find((candidate) => candidate.email === email && candidate.password === password);

  if (user) {
    db.currentUser = user;
    saveDB(db);
  }
  return user;
};

export const logout = () => {
  const db = getDB();
  db.currentUser = null;
  saveDB(db);
};

export const getCurrentUser = () => {
  return getDB().currentUser;
};

export const getUsersByRole = (role) => {
  return getDB().users.filter(u => u.role === role);
};

export const getUserById = (id) => {
  return getDB().users.find(u => u.id === id);
};

export const addMentee = (data) => {
    const db = getDB();
    const newUser = {
        ...data,
        id: `u${Date.now()}`,
        role: "mentee",
        avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'Mentee')}`,
        createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    db.currentUser = newUser;
    saveDB(db);
    return newUser;
};

export const addUser = (data) => {
  const db = getDB();
  const newUser = {
    ...data,
    id: `u${Date.now()}`,
    role: data.role || 'mentee',
    status: data.role === 'mentor' ? (data.status || 'approved') : data.status,
    avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}`,
    createdAt: new Date().toISOString()
  };
  db.users.push(newUser);
  saveDB(db);
  return newUser;
};

export const deleteUser = (id) => {
  const db = getDB();
  db.users = db.users.filter((user) => user.id !== id);
  db.bookings = (db.bookings || []).filter((booking) => booking.mentorId !== id && booking.menteeId !== id);
  db.sessions = (db.sessions || []).filter((session) => session.mentorId !== id && session.menteeId !== id);
  if (db.currentUser?.id === id) db.currentUser = null;
  saveDB(db);
  return { success: true };
};

// Booking Operations
export const getBookingsForUser = (userId) => {
  const db = getDB();
  return db.bookings.filter(b => b.menteeId === userId || b.mentorId === userId);
};

export const createBooking = (bookingData) => {
  const db = getDB();
  const mentor = db.users.find((user) => user.id === bookingData.mentorId);
  const mentee = db.users.find((user) => user.id === bookingData.menteeId);
  const newBooking = {
    ...bookingData,
    id: `b${Date.now()}`,
    status: "Pending",
    paymentStatus: "paid",
    createdAt: new Date().toISOString()
  };
  db.bookings.push(newBooking);

  if (!db.sessions) db.sessions = [];
  db.sessions.push({
    id: `s${Date.now()}`,
    bookingId: newBooking.id,
    menteeId: bookingData.menteeId,
    mentorId: bookingData.mentorId,
    menteeName: mentee?.name || 'Mentee',
    menteeAvatar: mentee?.avatar || '',
    dateTime: bookingData.date,
    time: bookingData.time,
    type: bookingData.sessionType || bookingData.type || 'Mentorship Session',
    topic: bookingData.sessionType || bookingData.type || 'Mentorship Session',
    notes: bookingData.notes || '',
    amount: bookingData.amount || mentor?.hourlyRate || 0,
    status: 'Pending',
    paymentStatus: 'paid',
    createdAt: new Date().toISOString(),
    isRated: false
  });

  if (!db.notifications) db.notifications = [];
  const bookingMessage = `${mentee?.name || 'A mentee'} booked ${mentor?.name || 'a mentor'} for ${bookingData.sessionType || 'a mentorship session'} on ${bookingData.date} at ${bookingData.time}.`;
  db.notifications.unshift({
    id: `n${Date.now()}`,
    title: 'New Booking Request',
    message: bookingMessage,
    timestamp: new Date().toISOString(),
    read: false,
    type: 'booking',
    userId: bookingData.mentorId
  }, {
    id: `n${Date.now() + 1}`,
    title: 'Booking Submitted',
    message: `Your booking with ${mentor?.name || 'your mentor'} is pending approval for ${bookingData.date} at ${bookingData.time}.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: 'booking',
    userId: bookingData.menteeId
  });
  saveDB(db);
  return newBooking;
};

export const getMentorAvailability = (mentorId) => {
  const mentor = getUserById(mentorId);
  return mentor?.availabilitySlots || {};
};

export const updateMentorAvailability = (mentorId, date, times) => {
  const db = getDB();
  const mentor = db.users.find((user) => user.id === mentorId);
  if (mentor) {
    mentor.availabilitySlots = mentor.availabilitySlots || {};
    const cleanedTimes = [...new Set((times || []).filter(Boolean))];
    if (cleanedTimes.length > 0) {
      mentor.availabilitySlots[date] = cleanedTimes;
    } else {
      delete mentor.availabilitySlots[date];
    }
    if (db.currentUser?.id === mentorId) db.currentUser = mentor;
    saveDB(db);
  }
  return { success: true };
};

export const updateBookingStatus = (bookingId, status) => {
  const db = getDB();
  const index = db.bookings.findIndex(b => b.id === bookingId);
  if (index !== -1) {
    db.bookings[index].status = status;
    const session = (db.sessions || []).find((item) => item.bookingId === bookingId);
    if (session) session.status = status;
    saveDB(db);
  }
};

// Sessions and Mentors
export const getSessions = () => {
  const db = getDB();
  return db.sessions || [];
};

export const saveSessions = (sessions) => {
  const db = getDB();
  db.sessions = sessions;
  saveDB(db);
};

export const updateSessionStatus = (sessionId, status) => {
  const db = getDB();
  const session = (db.sessions || []).find((item) => item.id === sessionId);
  if (session) {
    session.status = status;
    if (session.bookingId) {
      const booking = (db.bookings || []).find((item) => item.id === session.bookingId);
      if (booking) booking.status = status;
    }
    saveDB(db);
  }
  return { success: true };
};

export const getMentors = () => {
  return getUsersByRole('mentor');
};

export const cancelSession = (sessionId) => {
  const db = getDB();
  const sessions = db.sessions || [];
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index !== -1) {
    sessions[index].status = 'Cancelled';
    db.sessions = sessions;
    saveDB(db);
  }
  return { success: true };
};

export const completeSession = (sessionId) => {
  const db = getDB();
  const sessions = db.sessions || [];
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index !== -1) {
    sessions[index].status = 'Completed';
    db.sessions = sessions;
    saveDB(db);
  }
  return { success: true };
};

export const getReviewsForMentor = (mentorId) => {
  const db = getDB();
  return (db.reviews || []).filter((review) => review.mentorId === mentorId);
};

export const addReview = (mentorId, menteeId, menteeName, score, reviewText, sessionId = null) => {
  const db = getDB();
  const mentor = db.users.find(u => u.id === mentorId);
  const session = sessionId ? (db.sessions || []).find((item) => item.id === sessionId) : null;

  if (session && session.isRated) {
    return { success: false, error: 'Session already rated' };
  }

  if (mentor) {
    mentor.reviews = (mentor.reviews || 0) + 1;
    mentor.rating = (((mentor.rating || 5) * (mentor.reviews - 1)) + score) / mentor.reviews;

    if (!db.reviews) db.reviews = [];
    db.reviews.push({
      id: `r${Date.now()}`,
      mentorId,
      menteeId,
      menteeName,
      score,
      reviewText,
      sessionId,
      createdAt: new Date().toISOString()
    });

    if (session) {
      session.isRated = true;
      session.rating = score;
      session.reviewText = reviewText;
    }

    saveDB(db);
  }
  return { success: true };
};

// Admin Workflows
export const approveMentor = (id) => {
  const db = getDB();
  const mentor = db.users.find(u => u.id === id);
  if (mentor) {
    mentor.status = "approved";
    saveDB(db);
  }
  return { success: true };
};

export const rejectMentor = (id, reason) => {
  const db = getDB();
  const index = db.users.findIndex(u => u.id === id);
  if (index !== -1) {
    // Optionally save the reason somewhere, or just remove them
    db.users[index].status = "rejected";
    db.users[index].rejectionReason = reason;
    saveDB(db);
  }
  return { success: true };
};

export const updateUserProfile = (id, updates) => {
  const db = getDB();
  const userIndex = db.users.findIndex(u => u.id === id);
  if (userIndex !== -1) {
    db.users[userIndex] = { ...db.users[userIndex], ...updates };
    if (db.currentUser && db.currentUser.id === id) {
      db.currentUser = db.users[userIndex];
    }
    saveDB(db);
  }
  return { success: true };
};

// Notifications
export const getNotifications = () => {
  const db = getDB();
  return db.notifications || [];
};

export const markNotificationRead = (id) => {
  const db = getDB();
  const notif = db.notifications?.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    saveDB(db);
  }
};

export const deleteNotification = (id) => {
  const db = getDB();
  if (db.notifications) {
    db.notifications = db.notifications.filter(n => n.id !== id);
    saveDB(db);
  }
};

// Testimonials Methods
export const getTestimonials = () => {
  return getDB().testimonials || [];
};

export const addTestimonial = (testimonial) => {
  const db = getDB();
  if (!db.testimonials) db.testimonials = [];
  const newTestimonial = {
    ...testimonial,
    id: `t${Date.now()}`
  };
  db.testimonials.push(newTestimonial);
  saveDB(db);
  return newTestimonial;
};
