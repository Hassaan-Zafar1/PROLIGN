import React, { useState, useEffect } from 'react';
import { getDB, getUsersByRole } from '../utils/db';

const MentorDiscovery = ({ navigateTo }) => {
  const [allMentors, setAllMentors] = useState([]);
  
  const [filters, setFilters] = useState({
    domains: { Engineering: true, Design: true, Product: true },
    experience: 0,
    minRating: 0,
    priceRange: { min: 0, max: 250 },
    availableNow: false
  });
  
  const [sortBy, setSortBy] = useState('Relevance');
  
  useEffect(() => {
    setAllMentors(getUsersByRole('mentor'));
  }, []);

  const handleDomainChange = (domain) => {
    setFilters({
      ...filters,
      domains: { ...filters.domains, [domain]: !filters.domains[domain] }
    });
  };

  const resetFilters = () => {
    setFilters({
      domains: { Engineering: true, Design: true, Product: true },
      experience: 0,
      minRating: 0,
      priceRange: { min: 0, max: 250 },
      availableNow: false
    });
    setSortBy('Relevance');
  };

  const filteredMentors = allMentors.filter(m => {
    // Domain match
    let domainMatch = false;
    const isEng = m.industry.includes('Engineering') || m.industry.includes('Intelligence');
    const isDes = m.industry.includes('Design');
    const isProd = m.industry.includes('Product');
    
    if (filters.domains.Engineering && isEng) domainMatch = true;
    if (filters.domains.Design && isDes) domainMatch = true;
    if (filters.domains.Product && isProd) domainMatch = true;
    
    const anyDomainSelected = Object.values(filters.domains).some(Boolean);
    if (anyDomainSelected && !domainMatch) return false;

    // Experience match
    if ((m.experience || 0) < filters.experience) return false;

    // Rating match
    if ((m.rating || 0) < filters.minRating) return false;

    // Price match
    if (m.hourlyRate < filters.priceRange.min || m.hourlyRate > filters.priceRange.max) return false;

    return true;
  });

  const sortedMentors = [...filteredMentors].sort((a, b) => {
    if (sortBy === 'Highest Rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'Price: Low to High') return a.hourlyRate - b.hourlyRate;
    if (sortBy === 'Price: High to Low') return b.hourlyRate - a.hourlyRate;
    return 0; // Relevance / Default
  });

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)] w-full gap-6">
      {/* Sidebar Filter (25% width) */}
      <aside className="w-full md:w-1/4 bg-surface-dim/30 p-6 rounded-2xl border border-outline-variant/10 md:sticky md:top-20 h-auto md:max-h-[calc(100vh-100px)] overflow-y-auto">
        <div className="space-y-8">
          <div>
            <h3 className="font-headline-md text-2xl font-bold mb-4 text-primary">Filters</h3>
            <div className="space-y-3">
              <label className="font-label-sm text-sm font-semibold block text-on-surface-variant uppercase tracking-wider">Domain</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    checked={filters.domains.Engineering}
                    onChange={() => handleDomainChange('Engineering')}
                    className="rounded border-outline text-primary focus:ring-secondary w-5 h-5 bg-surface-container-lowest" 
                    type="checkbox"
                  />
                  <span className="text-body-md group-hover:text-primary transition-colors">Engineering & Data</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    checked={filters.domains.Design}
                    onChange={() => handleDomainChange('Design')}
                    className="rounded border-outline text-primary focus:ring-secondary w-5 h-5 bg-surface-container-lowest" 
                    type="checkbox"
                  />
                  <span className="text-body-md group-hover:text-primary transition-colors">Design</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    checked={filters.domains.Product}
                    onChange={() => handleDomainChange('Product')}
                    className="rounded border-outline text-primary focus:ring-secondary w-5 h-5 bg-surface-container-lowest" 
                    type="checkbox"
                  />
                  <span className="text-body-md group-hover:text-primary transition-colors">Product Management</span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="font-label-sm text-sm font-semibold block text-on-surface-variant uppercase tracking-wider">Experience (Years): {filters.experience}+</label>
            <input 
              className="w-full accent-primary h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer outline-none" 
              max="20" 
              min="0" 
              type="range" 
              value={filters.experience}
              onChange={(e) => setFilters({...filters, experience: parseInt(e.target.value)})}
            />
            <div className="flex justify-between font-caption text-xs text-on-surface-variant">
              <span>0</span>
              <span>10+</span>
              <span>20+</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-label-sm text-sm font-semibold block text-on-surface-variant uppercase tracking-wider">Minimum Rating</label>
              <span className="font-bold text-secondary">{filters.minRating.toFixed(1)}+</span>
            </div>
            <input 
              className="w-full accent-secondary h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer outline-none" 
              max="5" 
              min="0"
              step="0.5" 
              type="range" 
              value={filters.minRating}
              onChange={(e) => setFilters({...filters, minRating: parseFloat(e.target.value)})}
            />
          </div>

          <div className="space-y-3">
            <label className="font-label-sm text-sm font-semibold block text-on-surface-variant uppercase tracking-wider">Price per Session</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                <input 
                  className="w-full pl-7 pr-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-on-surface focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none" 
                  placeholder="0" 
                  type="number"
                  value={filters.priceRange.min}
                  onChange={(e) => setFilters({...filters, priceRange: {...filters.priceRange, min: parseInt(e.target.value) || 0}})}
                />
              </div>
              <span className="text-outline">—</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                <input 
                  className="w-full pl-7 pr-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-on-surface focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none" 
                  placeholder="250" 
                  type="number"
                  value={filters.priceRange.max}
                  onChange={(e) => setFilters({...filters, priceRange: {...filters.priceRange, max: parseInt(e.target.value) || 0}})}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/10">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="font-label-sm text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Available Now</span>
              <div className="relative inline-flex items-center cursor-pointer">
                <input className="sr-only peer" type="checkbox" value=""/>
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
              </div>
            </label>
          </div>

          <button 
            onClick={resetFilters}
            className="w-full py-3 bg-secondary-container text-on-secondary-container font-label-sm text-sm font-semibold rounded-lg hover:brightness-95 transition-all outline-none focus:ring-2 focus:ring-secondary"
          >
            Reset All Filters
          </button>
        </div>
      </aside>

      {/* Main Content (75% width) */}
      <section className="w-full md:w-3/4 space-y-6">
        {/* Sort and Results Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
          <div>
            <h2 className="font-headline-lg text-3xl font-bold text-primary">Discover Mentors</h2>
            <p className="text-on-surface-variant mt-1">Showing {sortedMentors.length} mentor{sortedMentors.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-label-sm text-sm font-semibold text-on-surface-variant">Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-2 font-label-sm text-sm font-semibold focus:ring-2 focus:ring-secondary focus:border-secondary outline-none cursor-pointer"
            >
              <option>Relevance</option>
              <option>Highest Rating</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Mentor Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {sortedMentors.length > 0 ? sortedMentors.map(mentor => (
            <article key={mentor.id} className="bg-surface-container-lowest rounded-xl p-6 natural-shadow border border-secondary/5 group hover:-translate-y-1 transition-transform duration-300">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
                  <img className="w-full h-full object-cover" src={mentor.avatar || `https://ui-avatars.com/api/?name=${mentor.name}`} alt={mentor.name}/>
                </div>
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <h3 className="font-headline-md text-xl font-bold text-primary group-hover:text-secondary transition-colors">{mentor.name}</h3>
                    <span className="bg-secondary-container/50 text-secondary px-3 py-1 rounded-full font-label-sm text-xs font-bold self-center sm:self-start">{mentor.industry}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-1">
                    <span className="material-symbols-outlined text-secondary text-sm fill-icon">star</span>
                    <span className="text-on-surface font-bold text-sm">{mentor.rating}</span>
                    <span className="text-on-surface-variant font-caption text-xs">({mentor.reviews} reviews)</span>
                  </div>
                  <p className="text-on-surface-variant text-sm line-clamp-2 mt-2">{mentor.bio}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-outline-variant/10 gap-4">
                <div className="flex flex-col text-center sm:text-left">
                  <span className="font-caption text-xs text-on-surface-variant">Rate per 45m session</span>
                  <span className="font-headline-md text-2xl font-bold text-primary">${mentor.hourlyRate}</span>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button onClick={() => navigateTo('mentorProfile', { mentorId: mentor.id })} className="flex-1 sm:flex-none px-6 py-2.5 bg-surface-variant text-on-surface font-label-sm text-sm font-semibold rounded-lg hover:bg-surface-dim transition-colors">View Profile</button>
                  <button onClick={() => navigateTo('booking', { mentorId: mentor.id })} className="flex-1 sm:flex-none px-6 py-2.5 bg-primary text-on-primary font-label-sm text-sm font-semibold rounded-lg hover:bg-primary-container transition-colors shadow-sm">Book Now</button>
                </div>
              </div>
            </article>
          )) : (
            <div className="col-span-full py-12 text-center flex flex-col items-center gap-4 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/30">
              <span className="material-symbols-outlined text-5xl text-outline-variant">person_search</span>
              <p className="font-headline-md text-xl text-on-surface-variant">No mentors found</p>
              <p className="text-sm text-on-surface-variant">Try adjusting your filters to see more results.</p>
              <button onClick={resetFilters} className="mt-2 text-secondary font-semibold text-sm hover:underline">Reset Filters</button>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center py-12 gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-on-primary font-label-sm text-sm font-bold shadow-md">1</button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors font-label-sm text-sm font-bold">2</button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors font-label-sm text-sm font-bold">3</button>
          <span className="text-outline mx-1">...</span>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors font-label-sm text-sm font-bold">12</button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default MentorDiscovery;
