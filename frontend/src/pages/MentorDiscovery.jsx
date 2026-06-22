import { useState, useMemo, useRef, useEffect } from 'react';
import { getUsersByRole } from '../utils/db';

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
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
          selected.length > 0
            ? 'bg-surface-container-high border-primary text-primary'
            : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-primary'
        }`}
      >
        <span className="truncate">{displayText}</span>
        <span className={`material-symbols-outlined text-lg transition-transform ${open ? 'rotate-180' : ''}`}>expand_more</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-surface-container-low border border-outline-variant/20 rounded-xl shadow-xl p-2 max-h-60 overflow-y-auto">
          {options.map(opt => {
            const checked = selected.includes(opt);
            return (
              <label
                key={opt}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  checked ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange(opt)}
                  className="rounded border-outline text-primary focus:ring-secondary w-4 h-4 bg-surface-container-lowest"
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
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
          value > 0
            ? 'bg-surface-container-high border-primary text-primary'
            : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-primary'
        }`}
      >
        <span className="truncate">{displayText}</span>
        <span className={`material-symbols-outlined text-lg transition-transform ${open ? 'rotate-180' : ''}`}>expand_more</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-surface-container-low border border-outline-variant/20 rounded-xl shadow-xl p-2">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
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
  const [allMentors] = useState(() => getUsersByRole('mentor'));
  const [filterOpen, setFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    expertise: [],
    experienceRanges: [],
    priceTiers: [],
    minRating: 0,
    days: [],
    languages: []
  });

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
      languages: []
    });
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
    return count;
  }, [filters]);

  const filteredMentors = useMemo(() => {
    return allMentors.filter(m => {
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

      return true;
    });
  }, [allMentors, filters]);

  const sortedMentors = useMemo(() => {
    const list = [...filteredMentors];
    switch (sortBy) {
      case 'Highest Rating': return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'Price: Low to High': return list.sort((a, b) => a.hourlyRate - b.hourlyRate);
      case 'Price: High to Low': return list.sort((a, b) => b.hourlyRate - a.hourlyRate);
      case 'Most Experienced': return list.sort((a, b) => (b.experience || 0) - (a.experience || 0));
      default: return list;
    }
  }, [filteredMentors, sortBy]);

  const filterSidebar = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-primary">Filters</h3>
        {activeFilterCount > 0 && (
          <button onClick={resetFilters} className="text-xs text-secondary hover:underline font-semibold">Clear All</button>
        )}
      </div>

      {/* Expertise */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">Expertise</h4>
        <MultiSelectDropdown
          label="Expertise"
          options={EXPERTISE_OPTIONS}
          selected={filters.expertise}
          onChange={(value) => toggleArrayFilter('expertise', value)}
        />
      </div>

      {/* Experience */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">Experience</h4>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE_RANGES.map((range, i) => (
            <button
              key={i}
              onClick={() => toggleArrayFilter('experienceRanges', i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filters.experienceRanges.includes(i)
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-primary hover:text-primary'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">Pricing</h4>
        <div className="flex flex-wrap gap-2">
          {PRICE_TIERS.map((tier, i) => (
            <button
              key={i}
              onClick={() => togglePriceTier(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filters.priceTiers.includes(i)
                  ? 'bg-secondary text-on-secondary border-secondary'
                  : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-secondary hover:text-secondary'
              }`}
            >
              {tier.label}{tier.max > 0 ? ` ($${tier.min}–$${tier.max})` : ' ($0)'}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">Minimum Rating</h4>
        <SingleSelectDropdown
          label="Rating"
          options={RATING_OPTIONS}
          value={filters.minRating}
          onChange={(value) => setFilters(prev => ({ ...prev, minRating: value }))}
        />
      </div>

      {/* Availability */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">Availability</h4>
        <MultiSelectDropdown
          label="Days"
          options={DAYS_OF_WEEK}
          selected={filters.days}
          onChange={(value) => toggleArrayFilter('days', value)}
          displayCount={3}
        />
      </div>

      <button
        onClick={resetFilters}
        className="w-full py-2.5 bg-surface-container-high text-on-surface font-semibold text-sm rounded-lg hover:bg-surface-variant transition-colors"
      >
        Reset All Filters
      </button>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] w-full gap-6 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 flex-shrink-0 bg-surface-dim/30 p-6 rounded-2xl border border-outline-variant/10 overflow-y-auto">
        {filterSidebar}
      </aside>

      {/* Mobile Filter Drawer */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFilterOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-surface-container-low shadow-2xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-primary">Filters</h3>
              <button onClick={() => setFilterOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {filterSidebar}
          </div>
        </div>
      )}

      {/* Main Content */}
      <section className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFilterOpen(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg text-sm font-semibold hover:bg-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-lg">filter_list</span>
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-primary text-on-primary text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{activeFilterCount}</span>
              )}
            </button>
            <div>
              <h2 className="text-2xl font-bold text-primary">Discover Mentors</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">{sortedMentors.length} mentor{sortedMentors.length !== 1 ? 's' : ''} found</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-on-surface-variant">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-secondary focus:border-secondary outline-none cursor-pointer"
            >
              <option>Relevance</option>
              <option>Highest Rating</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Most Experienced</option>
            </select>
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {sortedMentors.length > 0 ? sortedMentors.map(mentor => (
              <article key={mentor.id} className="bg-surface-container-lowest rounded-xl p-6 natural-shadow border border-secondary/5 group hover:-translate-y-1 transition-transform duration-300">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
                    <img className="w-full h-full object-cover" src={mentor.avatar || `https://ui-avatars.com/api/?name=${mentor.name}`} alt={mentor.name} />
                  </div>
                  <div className="flex-1 space-y-1.5 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <h3 className="text-lg font-bold text-primary group-hover:text-secondary transition-colors">{mentor.name}</h3>
                      <span className="bg-secondary-container/50 text-secondary px-3 py-1 rounded-full text-xs font-bold self-center sm:self-start">{mentor.industry}</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-1">
                      <span className="material-symbols-outlined text-secondary text-sm fill-icon">star</span>
                      <span className="font-bold text-sm">{mentor.rating}</span>
                      <span className="text-on-surface-variant text-xs">({mentor.reviews} reviews)</span>
                      {mentor.experience > 0 && (
                        <span className="text-on-surface-variant text-xs ml-2">· {mentor.experience} yrs exp</span>
                      )}
                    </div>
                    <p className="text-on-surface-variant text-sm line-clamp-2">{mentor.bio}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-outline-variant/10 gap-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary">${mentor.hourlyRate}</span>
                    <span className="text-xs text-on-surface-variant">/ session</span>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => navigateTo('mentorProfile', { mentorId: mentor.id })}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-surface-variant text-on-surface text-sm font-semibold rounded-lg hover:bg-surface-dim transition-colors"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => navigateTo('booking', { mentorId: mentor.id })}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-lg hover:brightness-110 transition-all shadow-sm"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </article>
            )) : (
              <div className="col-span-full py-16 text-center flex flex-col items-center gap-4 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/30">
                <span className="material-symbols-outlined text-5xl text-outline-variant">person_search</span>
                <p className="text-xl text-on-surface-variant font-semibold">No mentors found</p>
                <p className="text-sm text-on-surface-variant">Try adjusting your filters to see more results.</p>
                <button onClick={resetFilters} className="mt-2 text-secondary font-semibold text-sm hover:underline">Reset Filters</button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MentorDiscovery;
