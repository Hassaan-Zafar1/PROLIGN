const Footer = ({ navigateTo }) => {
  const socialLinks = [
    { name: 'Facebook', href: 'https://www.facebook.com/', icon: 'M24 12.073C24 5.446 18.627.073 12 .073S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
    { name: 'Twitter', href: 'https://twitter.com/', icon: 'M23.953 4.57a10 10 0 0 1-2.825.775 4.958 4.958 0 0 0 2.163-2.723 10.016 10.016 0 0 1-3.127 1.184A4.92 4.92 0 0 0 11.78 8.288 13.978 13.978 0 0 1 1.64 3.15a4.822 4.822 0 0 0-.665 2.475 4.92 4.92 0 0 0 2.188 4.096 4.904 4.904 0 0 1-2.228-.616v.06a4.923 4.923 0 0 0 3.946 4.827 4.996 4.996 0 0 1-2.224.085 4.936 4.936 0 0 0 4.6 3.42A9.868 9.868 0 0 1 0 19.54a13.94 13.94 0 0 0 7.548 2.209c9.142 0 14.307-7.721 13.995-14.646a10.002 10.002 0 0 0 2.41-2.534z' },
    { name: 'Instagram', href: 'https://www.instagram.com/', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.06-1.28.074-1.688.074-4.948s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98C15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z' },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.85-3.037-1.853 0-2.136 1.447-2.136 2.942v5.664H9.353V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.602 0 4.267 2.371 4.267 5.455v6.286zM5.337 7.433a2.063 2.063 0 1 1 0-4.126 2.063 2.063 0 0 1 0 4.126zM7.114 20.452H3.556V9h3.558v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
    { name: 'GitHub', href: 'https://github.com/', icon: 'M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z' },
    { name: 'YouTube', href: 'https://www.youtube.com/', icon: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
  ];

  return (
    <footer className="bg-primary text-on-primary py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4 cursor-pointer" onClick={() => navigateTo('home')}>
              <span className="material-symbols-outlined text-secondary-container">school</span>
              <span className="font-headline-md font-bold text-xl tracking-tight">ProLign</span>
            </div>
            <p className="text-sm text-on-primary/80">
              Connecting ambitious mentees with industry-leading mentors for career-defining guidance.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-secondary-container">Platform</h4>
            <ul className="space-y-2 text-sm text-on-primary/80">
              <li><button onClick={() => navigateTo('discovery')} className="hover:text-white transition-colors cursor-pointer text-left w-full">Find Mentors</button></li>
              <li><button onClick={() => navigateTo('mentorRegistration')} className="hover:text-white transition-colors cursor-pointer text-left w-full">Become a Mentor</button></li>
              <li><button onClick={() => navigateTo('how-it-works')} className="hover:text-white transition-colors cursor-pointer text-left w-full">How it Works</button></li>
              <li><button onClick={() => navigateTo('help-center')} className="hover:text-white transition-colors cursor-pointer text-left w-full">Help Center</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-secondary-container">Connect</h4>
            <div className="flex flex-row flex-wrap gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="w-10 h-10 rounded-lg bg-on-primary/10 flex items-center justify-center hover:bg-on-primary/20 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d={social.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-secondary-container">Legal</h4>
            <ul className="space-y-2 text-sm text-on-primary/80">
              <li><button onClick={() => navigateTo('terms')} className="hover:text-white transition-colors cursor-pointer text-left w-full">Terms of Service</button></li>
              <li><button onClick={() => navigateTo('privacy')} className="hover:text-white transition-colors cursor-pointer text-left w-full">Privacy Policy</button></li>
              <li><button onClick={() => navigateTo('cookies')} className="hover:text-white transition-colors cursor-pointer text-left w-full">Cookie Policy</button></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-on-primary/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-on-primary/60">
            &copy; {new Date().getFullYear()} ProLign. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;