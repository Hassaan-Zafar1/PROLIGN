const Footer = ({ navigateTo }) => {
  const socialLinks = [
    { name: 'LinkedIn', href: 'https://www.linkedin.com/', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.85-3.037-1.853 0-2.136 1.447-2.136 2.942v5.664H9.353V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.602 0 4.267 2.371 4.267 5.455v6.286zM5.337 7.433a2.063 2.063 0 1 1 0-4.126 2.063 2.063 0 0 1 0 4.126zM7.114 20.452H3.556V9h3.558v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
    { name: 'Email', href: 'mailto:prolignco@gmail.com', icon: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z' },
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