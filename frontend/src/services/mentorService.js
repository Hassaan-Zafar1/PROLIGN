import api from '../config/api';

/**
 * Mentor data service.
 *
 * All mentor reads go through here (no axios in components). The backend stores
 * mentor data on the User document; `normalizeMentor` maps that raw shape into
 * the flat shape the UI already expects (id, avatar, rating, industry, …), so
 * pages that previously read mock mentors keep working unchanged.
 *
 * Fields the backend doesn't have yet (rating/reviews — arriving with the
 * reviews system) default to 0 so the UI renders gracefully.
 */
export const normalizeMentor = (u) => {
  if (!u) return null;
  const id = String(u._id || u.id || '');
  const name = u.name || 'Mentor';
  const categories = u.preferredCategories || [];
  return {
    id,
    name,
    title: u.title || '',
    company: u.company || '',
    // "industry" is used as a category badge/subtitle in the UI.
    industry: categories[0] || u.title || '',
    expertise: categories,
    avatar: u.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4a5a2a&color=fff`,
    bio: u.bio || '',
    skills: u.skills || [],
    languages: u.languages || [],
    certifications: u.certifications || [],
    hourlyRate: u.hourlyRate ?? 0,
    experience: u.experience ?? 0,
    // Ratings land with the reviews feature (Task 6). Default to 0 for now.
    rating: u.rating ?? 0,
    reviews: u.reviews ?? 0,
    availability: u.availableSlots || [],
    country: u.country || '',
    city: u.city || '',
    linkedinUrl: u.linkedinUrl || '',
    // Listed mentors are, by definition, visible/approved.
    status: 'approved',
    createdAt: u.createdAt || null,
  };
};

export const mentorService = {
  // params: { search, skills, minExperience, sort, page, limit }
  getMentors: async (params = {}) => {
    const response = await api.get('/mentors', { params });
    const { mentors = [], total, page, pages } = response.data;
    return {
      mentors: mentors.map(normalizeMentor),
      total,
      page,
      pages,
    };
  },

  getMentorById: async (id) => {
    const response = await api.get(`/mentors/${id}`);
    return normalizeMentor(response.data.mentor);
  },
};
