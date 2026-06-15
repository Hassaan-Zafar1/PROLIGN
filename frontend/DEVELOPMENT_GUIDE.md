# MentorBridge Frontend - Project Documentation

## Overview

This is a production-ready React frontend for the MentorBridge mentorship platform. The application is built with React 19, Vite, React Router 7, and Tailwind CSS with a custom Material Design color system.

## Project Structure

```
frontend/
├── src/
│   ├── components/           # Reusable React components
│   │   ├── TopNavBar.jsx     # Navigation header
│   │   ├── Footer.jsx        # Footer component
│   │   ├── OTPModal.jsx      # OTP verification modal
│   │   └── SuccessModal.jsx  # Success/confirmation modal
│   │
│   ├── constants/            # Static data and configurations
│   │   └── mockData.js       # Mock database + API templates
│   │
│   ├── pages/                # Page-level components
│   │   ├── Landing.jsx       # Home page / Landing
│   │   ├── Login.jsx         # Unified login for all roles
│   │   ├── SignUp.jsx        # Mentee registration
│   │   └── MentorRegistration.jsx  # Mentor registration
│   │
│   ├── App.jsx               # Main app router
│   ├── App.css               # Global styles
│   ├── index.css             # Tailwind directives + fonts
│   ├── main.jsx              # App entry point
│   └── ...
│
├── tailwind.config.js        # Tailwind CSS configuration
├── vite.config.js            # Vite configuration
├── package.json              # Dependencies
└── README.md                 # This file
```

## Component Architecture

### Reusable Components

#### TopNavBar
- **Purpose**: Navigation header shared across all pages
- **Props**: `isHome` (boolean) - Sets active state for home link
- **Usage**:
  ```jsx
  <TopNavBar isHome={true} />
  ```

#### Footer
- **Purpose**: Footer section shared across all pages
- **Props**: None
- **Usage**:
  ```jsx
  <Footer />
  ```

#### OTPModal
- **Purpose**: Email verification with 4-digit OTP
- **Props**:
  - `isOpen` (boolean): Controls modal visibility
  - `email` (string): Email for display
  - `onVerify` (function): Called with OTP code
  - `onClose` (function): Close callback
  - `onResend` (function): Resend callback
- **Usage**:
  ```jsx
  <OTPModal
    isOpen={showOTP}
    email={formData.email}
    onVerify={handleVerify}
    onClose={() => setShowOTP(false)}
    onResend={() => console.log('Resend')}
  />
  ```

#### SuccessModal
- **Purpose**: Success/confirmation screen after registration
- **Props**:
  - `isOpen` (boolean): Controls visibility
  - `title` (string): Modal title
  - `message` (string): Success message
  - `onHome` (function): Return home callback
  - `onBrowse` (function): Browse marketplace callback
- **Usage**:
  ```jsx
  <SuccessModal
    isOpen={success}
    title="Application Submitted!"
    message="Your application is under review..."
    onHome={() => navigate('/')}
    onBrowse={() => navigate('/mentors')}
  />
  ```

## Pages

### Landing Page (`pages/Landing.jsx`)
- **Route**: `/`
- **Description**: Main landing page with features, testimonials, and CTAs
- **Data Sources**:
  - `FEATURES` - Feature cards
  - `STEPS` - 4-step process
  - `TESTIMONIALS` - User testimonials
- **Features**:
  - Hero section with gradient background
  - Feature cards with animations
  - How it works section
  - Testimonials carousel
  - CTA buttons

### Login Page (`pages/Login.jsx`)
- **Route**: `/login`
- **Description**: Unified login for mentees, mentors, and admins
- **Features**:
  - Email/password authentication
  - Error handling
  - Mock authentication (replace with API)
  - Role-based routing on success
  - Demo credentials display
- **Mock Data**: `MOCK_USERS` array
- **TODO API Integration**:
  ```javascript
  POST /api/auth/login
  Request: { email, password }
  Response: { token, user: { id, email, role, name } }
  ```

### SignUp Page (Mentee Registration) (`pages/SignUp.jsx`)
- **Route**: `/signup`
- **Description**: Mentee account creation and profile setup
- **Features**:
  - Two-column form layout
  - Personal information section
  - Career profile section
  - Skills/tags management
  - Form validation
  - OTP verification
  - Success confirmation
- **Form Fields**:
  - Full Name
  - Email
  - Password (with confirmation)
  - Career Goals (textarea)
  - Industry (dropdown)
  - Experience Level (dropdown)
  - Monthly Budget
- **TODO API Integration**:
  ```javascript
  POST /api/auth/register-mentee
  Request: {
    fullName,
    email,
    password,
    careerGoals,
    industry,
    experience,
    skills[],
    budget
  }
  Response: { token, user: { id, email, role: 'mentee', name } }
  ```

### Mentor Registration Page (`pages/MentorRegistration.jsx`)
- **Route**: `/mentor-registration`
- **Description**: Mentor application and profile creation
- **Features**:
  - Two-column form layout
  - Personal identity section
  - Professional credentials section
  - Expert domain management
  - File upload (CV/Resume)
  - Years of experience slider
  - Hourly rate input
  - Form validation
  - OTP verification
  - Application pending screen
- **Form Fields**:
  - Full Name
  - Email
  - Password (with confirmation)
  - LinkedIn URL
  - CV/Resume File
  - Expertise Domains (tags)
  - Years of Experience (1-40 slider)
  - Hourly Rate (USD)
- **TODO API Integration**:
  ```javascript
  POST /api/auth/register-mentor
  Request (FormData): {
    fullName,
    email,
    password,
    linkedinUrl,
    cvFile (file),
    expertise[] (JSON),
    yearsOfExperience,
    hourlyRate
  }
  Response: {
    token,
    user: { id, email, role: 'mentor', name },
    applicationStatus: 'pending'
  }
  ```

## Mock Data & Stubs (`constants/mockData.js`)

### Features
Mock data for landing page feature cards:
```javascript
FEATURES = [
  { id, icon, title, description }
]
```

### Steps
Mock data for "How It Works" section:
```javascript
STEPS = [
  { id, title, description }
]
```

### Testimonials
Mock data for testimonials:
```javascript
TESTIMONIALS = [
  { id, quote, author, role, image }
]
```

### Users
Mock authentication database:
```javascript
MOCK_USERS = [
  { id, email, password, role, name, token }
]
```

### Templates
Form templates for mentee and mentor profiles:
```javascript
MENTEE_PROFILE_TEMPLATE
MENTOR_PROFILE_TEMPLATE
```

### Options
Dropdown options:
```javascript
EXPERTISE_OPTIONS[]
INDUSTRIES[]
EXPERIENCE_LEVELS[]
```

## Styling System

### Tailwind Configuration

Custom color palette:
- **Primary**: `#202a10` (Dark Green)
- **Secondary**: `#5b6239` (Moss Green)
- **Tertiary**: `#312403` (Brown)
- **Error**: `#ba1a1a` (Red)
- **Surface**: `#fff8f3` (Off-white)

Custom spacing:
- `gutter`: 24px
- `base`: 24px
- `loose`: 48px
- `tight`: 12px
- `container-max`: 1280px

Custom typography:
- **Headline**: Playfair Display
- **Body**: Source Sans 3
- Sizes: xl, lg, md, sm with specific line heights

### CSS Classes

All Tailwind classes are available. Common custom classes:

- `.natural-shadow` - Custom box shadow with earthy tone
- `.hero-gradient` - Hero section gradient background
- `.shadow-natural` - Natural shadow effect

## API Integration Guide

### Replace Mock Data with API Calls

Every page with TODO comments indicates where to add API integration.

#### Example: Login Page

**Current (Mock)**:
```javascript
const user = MOCK_USERS.find(u => u.email === email && u.password === password);
```

**Future (API)**:
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();
if (!response.ok) throw new Error(data.message);

localStorage.setItem('authToken', data.token);
localStorage.setItem('user', JSON.stringify(data.user));
```

#### Authentication Context (TODO)

Create `src/context/AuthContext.jsx`:
```javascript
import { createContext, useState, useCallback } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  const login = useCallback(async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    // ...
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### API Endpoints Reference

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register-mentee` - Mentee registration
- `POST /api/auth/register-mentor` - Mentor registration
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/logout` - User logout

#### Data Fetching
- `GET /api/features` - Landing page features
- `GET /api/steps` - How it works steps
- `GET /api/testimonials` - User testimonials
- `GET /api/industries` - Industry options
- `GET /api/experience-levels` - Experience levels
- `GET /api/expertise-tags` - Expertise domain options

#### User Profiles
- `GET /api/mentors` - List all mentors
- `GET /api/mentees` - List all mentees
- `GET /api/profile/:id` - Get user profile
- `PUT /api/profile/:id` - Update user profile

#### Mentorship
- `GET /api/sessions` - User's sessions
- `POST /api/sessions` - Book a session
- `GET /api/messages/:sessionId` - Session messages
- `POST /api/messages/:sessionId` - Send message

## Development Workflow

### Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Adding New Pages

1. Create component in `src/pages/PageName.jsx`
2. Import in `src/App.jsx`
3. Add route:
   ```jsx
   <Route path="/page-name" element={<PageName />} />
   ```

### Adding New Components

1. Create component in `src/components/ComponentName.jsx`
2. Export default
3. Import and use in pages

### Using Mock Data

```javascript
import { FEATURES, MOCK_USERS } from '../constants/mockData';

// Use in component
const features = FEATURES.map(f => <FeatureCard key={f.id} {...f} />);
```

## Best Practices

1. **Always include TODO comments** for API integration points
2. **Use constants** from `mockData.js` instead of hardcoding
3. **Keep components pure** and pass data as props
4. **Use React hooks** for state management (useState, useEffect, useCallback)
5. **Validate forms** before submission
6. **Handle errors gracefully** with user-friendly messages
7. **Test with mock data** before connecting to real API
8. **Store auth token** in localStorage for persistence
9. **Implement role-based routing** after login
10. **Use semantic HTML** and proper ARIA labels

## Future Enhancements

- [ ] Authentication context provider
- [ ] Protected routes with role-based access
- [ ] Real-time messaging with WebSockets
- [ ] Video session integration
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] Advanced search and filters
- [ ] User profiles and portfolios
- [ ] Rating and review system
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

## Troubleshooting

### Tailwind CSS not loading
- Ensure `tailwind.config.js` is properly configured
- Run `npm run dev` to rebuild
- Check browser cache (Cmd+Shift+R / Ctrl+Shift+R)

### Fonts not loading
- Check Google Fonts import in `index.css`
- Verify font names match in Tailwind config
- Check network tab for failed requests

### Router not working
- Ensure `<BrowserRouter>` wraps `<App>` in `main.jsx`
- Check route paths in `App.jsx`
- Verify component imports

### Form validation not working
- Check error state in component
- Ensure validation runs before submission
- Verify error display JSX

## Support

For issues or questions:
1. Check TODO comments in the code
2. Review this documentation
3. Examine mock data structure
4. Test with sample data before API integration

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Production Ready (Mock Data)
