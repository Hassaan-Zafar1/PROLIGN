import React, { useState, useEffect } from 'react';
import { getReviewsForMentor, getUserById } from '../utils/db';

const MentorProfile = ({ navigateTo, params }) => {
  const [activeTab, setActiveTab] = useState('about');
  const [mentor, setMentor] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    // If no mentorId is passed, default to u1 for testing
    const mentorId = params?.mentorId || 'u1';
    const fetchedMentor = getUserById(mentorId);
    setMentor(fetchedMentor);
    setReviews(getReviewsForMentor(mentorId));
  }, [params]);

  if (!mentor) {
    return <div className="p-8 text-center text-on-surface-variant">Loading mentor profile...</div>;
  }

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row gap-12 items-start mb-12">
        <div className="w-full md:w-1/3 aspect-square rounded-xl overflow-hidden natural-shadow border border-secondary/10">
          <img 
            alt={mentor.name} 
            className="w-full h-full object-cover" 
            src={mentor.avatar || `https://ui-avatars.com/api/?name=${mentor.name}`}
          />
        </div>
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="font-headline-xl text-5xl font-bold text-primary">{mentor.name}</h1>
              <p className="font-headline-md text-2xl text-on-surface-variant mt-2">{mentor.title}</p>
            </div>
            <button 
              onClick={() => navigateTo('booking', { mentorId: mentor.id })}
              className="bg-primary text-on-primary px-8 py-4 rounded-lg font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-on-primary fill-icon">calendar_month</span>
              Book a Session
            </button>
          </div>
          <div className="flex flex-wrap gap-6 mt-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">location_on</span>
              <span className="font-label-sm text-sm font-semibold text-on-surface">Cambridge, UK</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined fill-icon text-on-tertiary-container">star</span>
              <span className="font-bold text-on-surface">{mentor.rating}/5</span>
              <span className="text-on-surface-variant text-sm">({mentor.reviews} reviews)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">group</span>
              <span className="font-bold text-on-surface">450+</span>
              <span className="text-on-surface-variant text-sm">Sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">bolt</span>
              <span className="text-on-surface-variant text-sm">Response:</span>
              <span className="font-bold text-on-surface">~2 hours</span>
            </div>
          </div>
          <div className="flex gap-3 mt-4 flex-wrap">
            {mentor.skills?.map(skill => (
              <span key={skill} className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold">{skill}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Content Tabs Navigation */}
      <div className="border-b border-outline-variant/20 mb-8">
        <div className="flex gap-8 overflow-x-auto">
          <button 
            className={`pb-4 transition-all font-label-sm text-sm whitespace-nowrap ${activeTab === 'about' ? 'text-primary border-b-2 border-primary font-bold' : 'text-on-surface-variant font-semibold hover:text-primary'}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button 
            className={`pb-4 transition-all font-label-sm text-sm whitespace-nowrap ${activeTab === 'expertise' ? 'text-primary border-b-2 border-primary font-bold' : 'text-on-surface-variant font-semibold hover:text-primary'}`}
            onClick={() => setActiveTab('expertise')}
          >
            Expertise
          </button>
          <button 
            className={`pb-4 transition-all font-label-sm text-sm whitespace-nowrap ${activeTab === 'reviews' ? 'text-primary border-b-2 border-primary font-bold' : 'text-on-surface-variant font-semibold hover:text-primary'}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews
          </button>
          <button 
            className={`pb-4 transition-all font-label-sm text-sm whitespace-nowrap ${activeTab === 'availability' ? 'text-primary border-b-2 border-primary font-bold' : 'text-on-surface-variant font-semibold hover:text-primary'}`}
            onClick={() => setActiveTab('availability')}
          >
            Availability
          </button>
        </div>
      </div>

      {/* Content Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* About Panel */}
          {activeTab === 'about' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="bg-surface-container p-8 rounded-xl border border-secondary/5">
                <h3 className="font-headline-md text-2xl font-bold text-primary mb-4">Professional Bio</h3>
                <p className="text-on-surface leading-relaxed mb-6">
                  I bridge the gap between human behavior and digital architecture. With over 15 years of experience at the intersection of anthropology and product development, I help mid-to-senior designers and product managers navigate the complexities of ethical design and high-stakes strategy. My approach is grounded in the belief that the most successful products are those that respect the cognitive and emotional landscapes of their users.
                </p>
                
                <h3 className="font-headline-md text-2xl font-bold text-primary mb-4 mt-8">Education & Work</h3>
                <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/30">
                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-on-primary"></div>
                    </div>
                    <h4 className="font-bold text-on-surface">{mentor.title}</h4>
                    <p className="text-sm font-semibold text-on-surface-variant">{mentor.company}</p>
                  </div>
                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-outline-variant flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-surface"></div>
                    </div>
                    <h4 className="font-bold text-on-surface">Director of UX Research</h4>
                    <p className="text-sm font-semibold text-on-surface-variant">Cognition Design Lab · 2012 - 2018</p>
                  </div>
                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-outline-variant flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-surface"></div>
                    </div>
                    <h4 className="font-bold text-on-surface">PhD in Cultural Anthropology</h4>
                    <p className="text-sm font-semibold text-on-surface-variant">Oxford University · 2008 - 2012</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expertise Panel */}
          {activeTab === 'expertise' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-container-high p-8 rounded-xl border border-secondary/5">
                  <h3 className="font-headline-md text-2xl font-bold text-primary mb-6">Skill Proficiency</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-on-surface text-sm">Behavioral Economics</span>
                        <span className="text-on-surface-variant text-sm">95%</span>
                      </div>
                      <div className="w-full bg-surface-variant rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{width: '95%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-on-surface text-sm">Ethical Tech Policy</span>
                        <span className="text-on-surface-variant text-sm">88%</span>
                      </div>
                      <div className="w-full bg-surface-variant rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{width: '88%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-on-surface text-sm">Qualitative Research</span>
                        <span className="text-on-surface-variant text-sm">92%</span>
                      </div>
                      <div className="w-full bg-surface-variant rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{width: '92%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-surface-container-high p-8 rounded-xl border border-secondary/5">
                  <h3 className="font-headline-md text-2xl font-bold text-primary mb-6">Session Types</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-background rounded-lg border border-outline-variant/10">
                      <span className="material-symbols-outlined text-3xl text-secondary">psychology</span>
                      <div>
                        <p className="font-bold text-sm">Portfolio Review</p>
                        <p className="text-xs text-on-surface-variant">Deep dive into research storytelling</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-background rounded-lg border border-outline-variant/10">
                      <span className="material-symbols-outlined text-3xl text-secondary">forum</span>
                      <div>
                        <p className="font-bold text-sm">Mock Interview</p>
                        <p className="text-xs text-on-surface-variant">Behavioral & Case study practice</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-background rounded-lg border border-outline-variant/10">
                      <span className="material-symbols-outlined text-3xl text-secondary">trending_up</span>
                      <div>
                        <p className="font-bold text-sm">Career Growth Strategy</p>
                        <p className="text-xs text-on-surface-variant">Planning the path to Principal/Lead</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reviews Panel */}
          {activeTab === 'reviews' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10">
                <div className="flex flex-col md:flex-row gap-8 mb-8 items-center border-b border-outline-variant/20 pb-8">
                  <div className="text-center">
                    <p className="text-6xl font-headline-xl font-bold text-primary leading-tight">{mentor.rating?.toFixed(1) || '4.9'}</p>
                    <div className="flex justify-center text-primary mb-1">
                      <span className="material-symbols-outlined fill-icon">star</span>
                      <span className="material-symbols-outlined fill-icon">star</span>
                      <span className="material-symbols-outlined fill-icon">star</span>
                      <span className="material-symbols-outlined fill-icon">star</span>
                      <span className="material-symbols-outlined fill-icon">star_half</span>
                    </div>
                    <p className="text-sm font-semibold text-on-surface-variant">Total {mentor.reviews || reviews.length} reviews</p>
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-sm font-semibold">5★</span>
                      <div className="flex-1 bg-surface-variant h-3 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{width: '90%'}}></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-sm font-semibold">4★</span>
                      <div className="flex-1 bg-surface-variant h-3 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{width: '8%'}}></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-sm font-semibold">3★</span>
                      <div className="flex-1 bg-surface-variant h-3 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{width: '2%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Individual Reviews */}
                <div className="space-y-6">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review.id} className="bg-background p-6 rounded-lg border border-outline-variant/10 natural-shadow">
                        <div className="flex justify-between items-start mb-4 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center font-bold text-primary">
                              {(review.menteeName || 'M').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{review.menteeName || 'Mentee'}</p>
                              <p className="text-xs text-on-surface-variant">Verified session review</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 justify-end text-secondary mb-1">
                              <span className="material-symbols-outlined text-[16px] fill-icon">star</span>
                              <span className="font-bold text-sm text-on-surface">{review.score}.0</span>
                            </div>
                            <span className="text-xs font-semibold text-on-surface-variant">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-on-surface leading-relaxed italic text-sm">
                          "{review.reviewText}"
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="bg-background p-8 rounded-lg border border-dashed border-outline-variant/20 text-center text-on-surface-variant">
                      No public reviews yet. Once mentees submit ratings, they will appear here.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Availability Panel */}
          {activeTab === 'availability' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-headline-md text-2xl font-bold text-primary">Weekly Schedule</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-primary rounded-full"></span>
                      <span className="text-sm font-semibold">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-surface-variant rounded-full"></span>
                      <span className="text-sm font-semibold">Booked</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-6 gap-2">
                  <div className="col-span-1"></div>
                  <div className="text-center font-bold pb-2 text-sm">Mon</div>
                  <div className="text-center font-bold pb-2 text-sm">Tue</div>
                  <div className="text-center font-bold pb-2 text-sm">Wed</div>
                  <div className="text-center font-bold pb-2 text-sm">Thu</div>
                  <div className="text-center font-bold pb-2 text-sm">Fri</div>
                  
                  {/* 09:00 */}
                  <div className="text-right pr-2 text-xs font-semibold text-on-surface-variant py-2">09:00</div>
                  <div className="bg-surface-variant rounded-lg h-10"></div>
                  <div onClick={() => navigateTo('booking', { mentorId: mentor.id })} className="bg-primary rounded-lg h-10 cursor-pointer hover:opacity-80 transition-opacity"></div>
                  <div className="bg-surface-variant rounded-lg h-10"></div>
                  <div onClick={() => navigateTo('booking', { mentorId: mentor.id })} className="bg-primary rounded-lg h-10 cursor-pointer hover:opacity-80 transition-opacity"></div>
                  <div className="bg-surface-variant rounded-lg h-10"></div>
                  
                  {/* 10:00 */}
                  <div className="text-right pr-2 text-xs font-semibold text-on-surface-variant py-2">10:00</div>
                  <div onClick={() => navigateTo('booking', { mentorId: mentor.id })} className="bg-primary rounded-lg h-10 cursor-pointer hover:opacity-80 transition-opacity"></div>
                  <div onClick={() => navigateTo('booking', { mentorId: mentor.id })} className="bg-primary rounded-lg h-10 cursor-pointer hover:opacity-80 transition-opacity"></div>
                  <div onClick={() => navigateTo('booking', { mentorId: mentor.id })} className="bg-primary rounded-lg h-10 cursor-pointer hover:opacity-80 transition-opacity"></div>
                  <div className="bg-surface-variant rounded-lg h-10"></div>
                  <div onClick={() => navigateTo('booking', { mentorId: mentor.id })} className="bg-primary rounded-lg h-10 cursor-pointer hover:opacity-80 transition-opacity"></div>
                  
                  {/* 11:00 */}
                  <div className="text-right pr-2 text-xs font-semibold text-on-surface-variant py-2">11:00</div>
                  <div className="bg-surface-variant rounded-lg h-10"></div>
                  <div onClick={() => navigateTo('booking', { mentorId: mentor.id })} className="bg-primary rounded-lg h-10 cursor-pointer hover:opacity-80 transition-opacity"></div>
                  <div className="bg-surface-variant rounded-lg h-10"></div>
                  <div className="bg-surface-variant rounded-lg h-10"></div>
                  <div className="bg-surface-variant rounded-lg h-10"></div>
                </div>
                <p className="mt-6 text-xs text-on-surface-variant text-center">* Times are displayed in GMT (Local Time)</p>
              </div>
            </div>
          )}

        </div>

        {/* Sidebar Widgets */}
        <aside className="space-y-6">
          <div className="bg-surface-container-high p-6 rounded-xl border border-secondary/10 natural-shadow">
            <h4 className="font-headline-md text-2xl font-bold text-primary mb-4">Quick Stats</h4>
            <ul className="space-y-4">
              <li className="flex justify-between items-center">
                <span className="text-on-surface-variant text-sm">Price per hour</span>
                <span className="font-bold text-primary text-xl">${mentor.hourlyRate}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-on-surface-variant text-sm">Active Mentees</span>
                <span className="font-bold text-sm">12</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-on-surface-variant text-sm">Materials Shared</span>
                <span className="font-bold text-sm">84</span>
              </li>
            </ul>
            <hr className="my-6 border-outline-variant/20"/>
            
            <button className="w-full text-secondary font-bold text-sm flex items-center justify-center gap-2 hover:bg-secondary/5 py-2 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[20px]">share</span>
              Share Profile
            </button>
          </div>
          
        
        </aside>
      </div>
    </div>
  );
};

export default MentorProfile;
