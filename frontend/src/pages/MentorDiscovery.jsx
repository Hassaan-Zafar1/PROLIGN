import { useState, useMemo, useRef, useEffect } from 'react';
import { useMentors } from '../hooks/useMentors';
import { getMentorLevel, getMentorLevelStyle, MENTOR_LEVEL_OPTIONS } from '../utils/mentorLevel';

const EXPERTISE_OPTIONS = [
  'Software Engineering',
  'Artificial Intelligence',
  'Product Management',
  'Design',
  'Cybersecurity',
  'Data Science',
  'Marketing',
  'Business'
];

const EXPERIENCE_RANGES = [
  { label: '0–2 years', min: 0, max: 2 },
  { label: '3–5 years', min: 3, max: 5 },
  { label: '6–10 years', min: 6, max: 10 },
  { label: '10+ years', min: 10, max: 99 }
];

const PRICE_TIERS = [
  { label: 'Free', min: 0, max: 0 },
  { label: 'Budget', min: 1, max: 75 },
  { label: 'Standard', min: 76, max: 150 },
  { label: 'Premium', min: 151, max: 999 }
];

const RATING_OPTIONS = [
  { label: 'Any', value: 0 },
  { label: '4+', value: 4 },
  { label: '4.5+', value: 4.5 },
  { label: '5', value: 5 }
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SORT_OPTIONS = ['Relevance', 'Highest Rating', 'Price: Low to High', 'Price: High to Low', 'Most Experienced', 'Newest Mentors', 'Oldest Mentors', 'Junior First', 'Intermediate First', 'Senior First'];

const useClickOutside = (handler) => {
  const ref = useRef(null);
  useEffect(() => {
    const listener = (e) => { if (ref.current && !ref.current.contains(e.target)) handler(); };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => { document.removeEventListener('mousedown', listener); document.removeEventListener('touchstart', listener); };
  }, [handler]);
  return ref;
};

const MultiSelectDropdown = ({ label, options, selected, onChange, displayCount = 2 }) => {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  const displayText = selected.length === 0
    ? `All ${label}`
    : selected.length <= displayCount
      ? selected.join(', ')
      : `${selected.length} selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
          selected.length > 0
            ? 'bg-primary/5 border-primary text-primary'
            : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:border-primary/50'
        }`}
      >
        <span className="truncate">{displayText}</span>
        <span className={`material-symbols-outlined text-lg transition-transform ${open ? 'rotate-180' : ''}`}>expand_more</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1.5 w-full bg-surface border border-outline-variant/20 rounded-xl shadow-xl p-2 max-h-60 overflow-y-auto">
          {options.map(opt => {
            const checked = selected.includes(opt);
            return (
              <label
                key={opt}
                className={`flex items-center gap-3 px-3 min-h-[44px] py-2.5 rounded-lg cursor-pointer transition-colors ${
                  checked ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange(opt)}
                  className="rounded border-outline text-primary focus:ring-secondary w-4 h-4 bg-surface"
                />
                <span className="text-sm font-medium">{opt}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SingleSelectDropdown = ({ label, options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  const selectedOption = options.find(o => o.value === value);
  const displayText = selectedOption ? selectedOption.label : `All ${label}`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
          value > 0
            ? 'bg-primary/5 border-primary text-primary'
            : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:border-primary/50'
        }`}
      >
        <span className="truncate">{displayText}</span>
        <span className={`material-symbols-outlined text-lg transition-transform ${open ? 'rotate-180' : ''}`}>expand_more</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1.5 w-full bg-surface border border-outline-variant/20 rounded-xl shadow-xl p-2">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                value === opt.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {opt.value > 0 && <span className="material-symbols-outlined text-sm fill-icon">star</span>}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const MentorDiscovery = ({ navigateTo }) => {
  // Mentors now come from the backend (service layer) instead of the mock DB.
  // We fetch the listable set and keep the existing client-side filtering/sorting.
  const { mentors: allMentors, loading, error, refetch } = useMentors({ limit: 100 });
  const [filterOpen, setFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    expertise: [],
    experienceRanges: [],
    priceTiers: [],
    minRating: 0,
    days: [],
    languages: [],
    mentorLevel: 'all'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [sortBy, setSortBy] = useState('Relevance');

  const toggleArrayFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }));
  };

  const togglePriceTier = (tierIndex) => {
    setFilters(prev => ({
      ...prev,
      priceTiers: prev.priceTiers.includes(tierIndex)
        ? prev.priceTiers.filter(i => i !== tierIndex)
        : [...prev.priceTiers, tierIndex]
    }));
  };

  const resetFilters = () => {
    setFilters({
      expertise: [],
      experienceRanges: [],
      priceTiers: [],
      minRating: 0,
      days: [],
      languages: [],
      mentorLevel: 'all'
    });
    setSearchQuery('');
    setSortBy('Relevance');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.expertise.length) count++;
    if (filters.experienceRanges.length) count++;
    if (filters.priceTiers.length) count++;
    if (filters.minRating > 0) count++;
    if (filters.days.length) count++;
    if (filters.languages.length) count++;
    if (filters.mentorLevel !== 'all') count++;
    return count;
  }, [filters]);

  const filteredMentors = useMemo(() => {
    return allMentors.filter(m => {
      if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.trim().toLowerCase();
        const name = (m.name || '').toLowerCase();
        const bio = (m.bio || '').toLowerCase();
        const industry = (m.industry || '').toLowerCase();
        const skills = (m.skills || []).join(' ').toLowerCase();
        const expertise = (m.expertise || []).join(' ').toLowerCase();
        const category = (m.category || '').toLowerCase();
        if (!name.includes(q) && !bio.includes(q) && !industry.includes(q) && !skills.includes(q) && !expertise.includes(q) && !category.includes(q)) {
          return false;
        }
      }

      if (filters.expertise.length > 0) {
        const match = filters.expertise.some(exp =>
          m.industry?.toLowerCase().includes(exp.toLowerCase())
        );
        if (!match) return false;
      }

      if (filters.experienceRanges.length > 0) {
        const exp = m.experience || 0;
        const match = filters.experienceRanges.some(idx => {
          const range = EXPERIENCE_RANGES[idx];
          return exp >= range.min && exp <= range.max;
        });
        if (!match) return false;
      }

      if (filters.priceTiers.length > 0) {
        const rate = m.hourlyRate || 0;
        const match = filters.priceTiers.some(idx => {
          const tier = PRICE_TIERS[idx];
          return rate >= tier.min && rate <= tier.max;
        });
        if (!match) return false;
      }

      if (filters.minRating > 0) {
        if ((m.rating || 0) < filters.minRating) return false;
      }

      if (filters.days.length > 0) {
        const availDays = (m.availability || []).map(s => s.split(' ')[0]);
        const match = filters.days.some(day => availDays.includes(day));
        if (!match) return false;
      }

      if (filters.languages.length > 0) {
        const langs = m.languages || ['English'];
        const match = filters.languages.some(l => langs.includes(l));
        if (!match) return false;
      }

      if (filters.mentorLevel !== 'all') {
        const { level } = getMentorLevel(m);
        if (level !== filters.mentorLevel) return false;
      }

      return true;
    });
  }, [allMentors, filters, debouncedSearchQuery]);

  const sortedMentors = useMemo(() => {
    const list = [...filteredMentors];
    switch (sortBy) {
      case 'Highest Rating': return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'Price: Low to High': return list.sort((a, b) => a.hourlyRate - b.hourlyRate);
      case 'Price: High to Low': return list.sort((a, b) => b.hourlyRate - a.hourlyRate);
      case 'Most Experienced': return list.sort((a, b) => (b.experience || 0) - (a.experience || 0));
      case 'Newest Mentors': return list.sort((a, b) => new Date(b.registeredAt || b.createdAt || 0) - new Date(a.registeredAt || a.createdAt || 0));
      case 'Oldest Mentors': return list.sort((a, b) => new Date(a.registeredAt || a.createdAt || 0) - new Date(b.registeredAt || b.createdAt || 0));
      case 'Junior First': return list.sort((a, b) => getMentorLevel(a).exact - getMentorLevel(b).exact);
      case 'Senior First': return list.sort((a, b) => getMentorLevel(b).exact - getMentorLevel(a).exact);
      case 'Intermediate First': return list.sort((a, b) => {
        const la = getMentorLevel(a).level, lb = getMentorLevel(b).level;
        if (la === 'intermediate' && lb !== 'intermediate') return -1;
        if (lb === 'intermediate' && la !== 'intermediate') return 1;
        return 0;
      });
      default: return list;
    }
  }, [filteredMentors, sortBy]);

  const filterSidebar = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-xl">filter_list</span>
          Filters
        </h3>
        {activeFilterCount > 0 && (
          <button onClick={resetFilters} className="text-xs text-secondary hover:underline font-semibold min-h-[44px] px-2 flex items-center">Clear All</button>
        )}
      </div>

      <div className="h-px bg-outline-variant/20" />

      {/* Expertise */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">psychology</span>
          Expertise
        </h4>
        <MultiSelectDropdown
          label="Expertise"
          options={EXPERTISE_OPTIONS}
          selected={filters.expertise}
          onChange={(value) => toggleArrayFilter('expertise', value)}
        />
      </div>

      {/* Experience */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">work</span>
          Experience
        </h4>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE_RANGES.map((range, i) => (
            <button
              key={i}
              onClick={() => toggleArrayFilter('experienceRanges', i)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                filters.experienceRanges.includes(i)
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:border-primary hover:text-primary'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">payments</span>
          Pricing
        </h4>
        <div className="flex flex-wrap gap-2">
          {PRICE_TIERS.map((tier, i) => (
            <button
              key={i}
              onClick={() => togglePriceTier(i)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                filters.priceTiers.includes(i)
                  ? 'bg-secondary text-on-secondary border-secondary'
                  : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:border-secondary hover:text-secondary'
              }`}
            >
              {tier.label}{tier.max > 0 ? ` ($${tier.min}–$${tier.max})` : ' ($0)'}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm fill-icon">star</span>
          Minimum Rating
        </h4>
        <SingleSelectDropdown
          label="Rating"
          options={RATING_OPTIONS}
          value={filters.minRating}
          onChange={(value) => setFilters(prev => ({ ...prev, minRating: value }))}
        />
      </div>

      {/* Availability */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">schedule</span>
          Availability
        </h4>
        <MultiSelectDropdown
          label="Days"
          options={DAYS_OF_WEEK}
          selected={filters.days}
          onChange={(value) => toggleArrayFilter('days', value)}
          displayCount={3}
        />
      </div>

      {/* Experience Level (Part 19) */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">workspace_premium</span>
          Experience Level
        </h4>
        <SingleSelectDropdown
          label="Level"
          options={MENTOR_LEVEL_OPTIONS.map(opt => ({ label: opt.label, value: opt.id }))}
          value={filters.mentorLevel}
          onChange={(value) => setFilters(prev => ({ ...prev, mentorLevel: value }))}
        />
      </div>

      <div className="h-px bg-outline-variant/20" />

      <button
        onClick={resetFilters}
        className="w-full min-h-[44px] py-2.5 bg-surface-container-high text-on-surface font-semibold text-sm rounded-xl hover:bg-surface-variant transition-colors"
      >
        Reset All Filters
      </button>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Hero/Search Header */}
      <div className="bg-gradient-to-br from-primary/5 via-surface to-secondary/5 rounded-2xl border border-outline-variant/10 p-6 sm:p-8 mb-6 lg:mb-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2">
              Find Your Perfect Mentor
            </h1>
            <p className="text-on-surface-variant text-sm sm:text-base max-w-xl">
              Connect with experienced professionals who will guide you through your career journey.
            </p>
            <p className="text-on-surface-variant/70 text-xs sm:text-sm mt-2">
              {sortedMentors.length} mentor{sortedMentors.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-xl">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search mentors..."
                className="w-full sm:w-72 h-11 bg-surface border border-outline-variant/30 rounded-xl pl-11 pr-10 text-sm text-on-surface outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all placeholder:text-on-surface-variant/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 text-on-surface-variant/60 hover:text-on-surface">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="bg-surface rounded-2xl border border-outline-variant/10 p-5 sticky top-6">
            {filterSidebar}
          </div>
        </aside>

        {/* Mobile Filter Drawer */}
        {filterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setFilterOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-surface shadow-2xl p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-primary">Filters</h3>
                <button onClick={() => setFilterOpen(false)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              {filterSidebar}
            </div>
          </div>
        )}

        {/* Main Content */}
        <section className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 min-h-[44px] px-4 py-2.5 bg-surface rounded-xl border border-outline-variant/30 text-sm font-semibold hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-lg">filter_list</span>
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-primary text-on-primary text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{activeFilterCount}</span>
                )}
              </button>
              <p className="text-sm text-on-surface-variant">
                <span className="font-bold text-on-surface">{sortedMentors.length}</span> mentor{sortedMentors.length !== 1 ? 's' : ''} found
                {activeFilterCount > 0 && (
                  <span className="text-secondary ml-2">· {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-on-surface-variant">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-surface border border-outline-variant/30 rounded-xl px-3 min-h-[44px] py-2 text-sm font-semibold focus:ring-2 focus:ring-secondary focus:border-secondary outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface rounded-2xl p-5 border border-outline-variant/10 animate-pulse">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-surface-container-high" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-surface-container-high rounded w-2/3" />
                      <div className="h-3 bg-surface-container-high rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-surface-container-high rounded w-full mb-2" />
                  <div className="h-3 bg-surface-container-high rounded w-4/5 mb-4" />
                  <div className="flex gap-1.5 mb-4">
                    <div className="h-5 w-14 bg-surface-container-high rounded-full" />
                    <div className="h-5 w-14 bg-surface-container-high rounded-full" />
                  </div>
                  <div className="pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                    <div className="h-6 w-16 bg-surface-container-high rounded" />
                    <div className="h-10 w-28 bg-surface-container-high rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-16 text-center flex flex-col items-center gap-4 bg-surface rounded-2xl border border-dashed border-outline-variant/30">
              <span className="material-symbols-outlined text-5xl text-error/60">cloud_off</span>
              <div>
                <p className="text-lg text-on-surface-variant font-semibold mb-1">Couldn't load mentors</p>
                <p className="text-sm text-on-surface-variant/70">Please check your connection and try again.</p>
              </div>
              <button onClick={refetch} className="mt-2 min-h-[44px] px-5 py-2.5 bg-secondary text-on-secondary font-semibold text-sm rounded-xl hover:brightness-110 transition-all">
                Retry
              </button>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sortedMentors.length > 0 ? sortedMentors.map(mentor => (
              <article key={mentor.id} className="bg-surface rounded-2xl p-5 border border-outline-variant/10 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
                {/* Card Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                    <img className="w-full h-full object-cover" src={mentor.avatar || `https://ui-avatars.com/api/?name=${mentor.name}`} alt={mentor.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-primary truncate">{mentor.name}</h3>
                    <p className="text-xs text-on-surface-variant truncate">{mentor.title || mentor.industry}</p>
                    {(() => {
                      const ml = getMentorLevel(mentor);
                      const mlStyle = getMentorLevelStyle(ml.level);
                      return (
                        <div className={`mt-1.5 mentor-level-badge mentor-level-${ml.level} ${mlStyle.wrapper}`}>
                          {mlStyle.icon && <span className="material-symbols-outlined text-[10px]">{mlStyle.icon}</span>}
                          {ml.label}
                        </div>
                      );
                    })()}
                  </div>
                  <span className="bg-secondary/10 text-secondary px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap">
                    {mentor.industry}
                  </span>
                </div>

                {/* Rating & Experience */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-secondary text-sm fill-icon">star</span>
                    <span className="font-bold text-sm">{mentor.rating}</span>
                    <span className="text-on-surface-variant text-xs">({mentor.reviews})</span>
                  </div>
                  {mentor.experience > 0 && (
                    <span className="text-on-surface-variant text-xs">· {mentor.experience} yrs exp</span>
                  )}
                </div>

                {/* Bio */}
                <p className="text-on-surface-variant text-xs leading-relaxed line-clamp-2 mb-4">{mentor.bio}</p>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(mentor.skills || []).slice(0, 3).map(skill => (
                    <span key={skill} className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full text-[10px] font-medium">
                      {skill}
                    </span>
                  ))}
                  {(mentor.skills || []).length > 3 && (
                    <span className="text-on-surface-variant/60 text-[10px]">+{(mentor.skills || []).length - 3}</span>
                  )}
                </div>

                {/* Price & Actions */}
                <div className="mt-auto pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-primary">${mentor.hourlyRate}</span>
                    <span className="text-[10px] text-on-surface-variant">/ session</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigateTo('mentorProfile', { mentorId: mentor.id })}
                      className="min-h-[44px] px-4 py-2.5 bg-surface-container-high text-on-surface text-sm font-semibold rounded-xl hover:bg-surface-variant transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigateTo('booking', { mentorId: mentor.id })}
                      className="min-h-[44px] px-4 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-xl hover:brightness-110 transition-all shadow-sm"
                    >
                      Book
                    </button>
                  </div>
                </div>
              </article>
            )) : (
              <div className="col-span-full py-16 text-center flex flex-col items-center gap-4 bg-surface rounded-2xl border border-dashed border-outline-variant/30">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">person_search</span>
                <div>
                  <p className="text-lg text-on-surface-variant font-semibold mb-1">
                    {debouncedSearchQuery.trim() ? 'No mentors match your search' : 'No Mentors Found'}
                  </p>
                  <p className="text-sm text-on-surface-variant/70">
                    {debouncedSearchQuery.trim()
                      ? 'Try a different name or keyword.'
                      : 'Try adjusting your filters to discover more mentors.'}
                  </p>
                </div>
                <button onClick={resetFilters} className="mt-2 min-h-[44px] px-5 py-2.5 bg-secondary text-on-secondary font-semibold text-sm rounded-xl hover:brightness-110 transition-all">
                  Reset Filters
                </button>
              </div>
            )}
          </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MentorDiscovery;
