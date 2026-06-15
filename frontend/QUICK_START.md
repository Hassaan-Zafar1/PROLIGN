# MentorBridge Frontend - Quick Start Guide

## What Has Been Built

✅ **Complete React Frontend** with 4 production-ready pages:
- Landing Page (with features, testimonials, CTAs)
- Login Page (unified for all user roles)
- Mentee Registration (with career profile)
- Mentor Registration (with professional credentials)

✅ **Reusable Components**:
- TopNavBar (navigation header)
- Footer (footer section)
- OTPModal (email verification)
- SuccessModal (confirmation screen)

✅ **Mock Data System**:
- Complete mock database in `src/constants/mockData.js`
- Easy swap to real API with TODO comments
- Templates for mentee & mentor profiles
- Dropdown options (industries, expertise, experience levels)

✅ **Design System**:
- Custom Tailwind CSS configuration
- Material Design 3 color palette
- Custom spacing and typography
- Material Icons integration
- Responsive design on all pages

---

## File Structure Quick Reference

```
src/
├── pages/              # 4 main pages
│   ├── Landing.jsx
│   ├── Login.jsx
│   ├── SignUp.jsx
│   └── MentorRegistration.jsx
├── components/         # 4 reusable components
│   ├── TopNavBar.jsx
│   ├── Footer.jsx
│   ├── OTPModal.jsx
│   └── SuccessModal.jsx
├── constants/
│   └── mockData.js     # All mock data + API stubs
├── App.jsx             # Router configuration
└── main.jsx            # Entry point
```

---

## Running the App

```bash
cd frontend

# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

**Access at**: http://localhost:5173

---

## Demo Credentials (Mock Auth)

```
Mentee:
  Email: mentee@example.com
  Password: password123

Mentor:
  Email: mentor@example.com
  Password: password123
```

---

## Key Features by Page

### Landing Page (`/`)
- Hero section with gradient
- 3 feature cards with icons
- 4-step process flow
- 2 testimonials with images
- CTA buttons to register
- Smooth scroll animations

### Login Page (`/login`)
- Email & password fields
- Error handling
- Demo credentials display
- Links to registration pages
- Mock authentication (replace with API)

### Mentee SignUp (`/signup`)
- 2-column form layout
- Personal info section
- Career profile section
- Industry dropdown
- Experience level selector
- Budget input
- OTP verification modal
- Success confirmation

### Mentor Registration (`/mentor-registration`)
- 2-column form layout
- Personal identity section
- Professional credentials section
- LinkedIn URL field
- CV/Resume file upload
- Expertise tags management
- Experience slider (1-40 years)
- Hourly rate input
- OTP verification
- Application pending screen

---

## Using Mock Data

### Import Mock Data
```javascript
import { FEATURES, TESTIMONIALS, MOCK_USERS } from '../constants/mockData';
```

### Use in Components
```javascript
// In page component
{FEATURES.map(feature => (
  <div key={feature.id}>{feature.title}</div>
))}
```

### Easy Migration to API
Every mock data usage has a TODO comment showing where to add API calls.

---

## Adding API Integration

### Step 1: Update mockData.js
Add API functions:
```javascript
export async function login(email, password) {
  return fetch('/api/auth/login', {...}).then(r => r.json());
}
```

### Step 2: Update Page Components
Replace mock logic:
```javascript
// Replace mock authentication
const handleLogin = async (e) => {
  const data = await login(email, password);
  localStorage.setItem('authToken', data.token);
  navigate(`/${data.user.role}-dashboard`);
};
```

### Step 3: Update .env
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

See `API_INTEGRATION_GUIDE.md` for detailed examples.

---

## Styling Notes

### Available Tailwind Classes

All standard Tailwind classes plus:

**Custom Colors**:
- `bg-primary`, `text-primary` (dark green)
- `bg-secondary`, `text-secondary` (moss green)
- `bg-surface`, `bg-surface-dim` (off-white variants)
- All Material Design 3 colors

**Custom Spacing**:
- `p-gutter`, `px-gutter` (24px padding)
- `gap-base`, `gap-loose` (24px, 48px)
- `max-w-container-max` (1280px)

**Custom Shadows**:
- `shadow-natural` (earthy shadow)

**Custom Fonts**:
- `font-headline-*` (Playfair Display)
- `font-body-md` (Source Sans 3)
- `font-label-sm` (Source Sans 3 bold)

---

## Form Validation

All pages include validation before submission:

```javascript
// Validation example
if (!formData.email) {
  setErrors(prev => ({ ...prev, email: 'Email is required' }));
}

// Display error
{errors.email && <p className="text-error text-caption">{errors.email}</p>}
```

---

## State Management

Uses React's `useState` and `useEffect`. For complex apps, consider:
- Redux or Zustand for global state
- React Context for auth state
- Custom hooks for repeated logic

---

## Authentication Flow

### Mock (Current)
1. User enters credentials
2. Check against `MOCK_USERS` array
3. Store in localStorage
4. Redirect to dashboard

### Real API (Next)
1. User enters credentials
2. POST to `/api/auth/login`
3. Receive JWT token
4. Store token + user in localStorage
5. Add token to all future requests
6. Redirect to dashboard

---

## Next Steps for Integration

1. **Set up backend API** (Node.js, Python, etc.)
2. **Create API endpoints** (see API_INTEGRATION_GUIDE.md)
3. **Update .env** with API URL
4. **Replace mock auth** in Login.jsx
5. **Replace mock data fetches** in Landing.jsx
6. **Add API functions** to mockData.js
7. **Create authentication context** for global auth state
8. **Add protected routes** for authenticated pages
9. **Implement refresh token** rotation
10. **Add error handling** for network issues

---

## Responsive Design

All pages are responsive:
- **Mobile**: Single column, full width (< 640px)
- **Tablet**: Optimized layout (640px - 1024px)
- **Desktop**: Full 2-column layout (> 1024px)

Use Tailwind breakpoints:
```jsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
  {/* Single column on mobile, 2 columns on large screens */}
</div>
```

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Performance Optimizations

- Lazy loading of images
- CSS-in-JS (Tailwind) minimizes CSS bloat
- React 19 with auto batching
- Vite for fast development
- Code splitting with React Router
- Minimal external dependencies

---

## Accessibility Features

- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast compliant
- Form labels associated with inputs
- Focus indicators visible

---

## Common Tasks

### Adding a New Page
1. Create `src/pages/NewPage.jsx`
2. Import in `App.jsx`
3. Add route: `<Route path="/path" element={<NewPage />} />`

### Adding a Reusable Component
1. Create `src/components/Component.jsx`
2. Export as default
3. Import in pages

### Adding Form Fields
1. Add to formData state
2. Add input element
3. Update validation
4. Include in API request

### Styling a Component
1. Use Tailwind classes directly
2. Reference color palette
3. Use custom spacing variables
4. No CSS files needed

---

## Documentation Files

- **DEVELOPMENT_GUIDE.md** - Comprehensive development guide
- **API_INTEGRATION_GUIDE.md** - Detailed API integration steps
- **This file** - Quick reference

---

## Support & Troubleshooting

### Styles not applying?
- Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
- Restart dev server
- Check Tailwind config

### Form not submitting?
- Check browser console for errors
- Verify validation logic
- Check handleSubmit function

### OTP not appearing?
- Check `isOpen` prop
- Verify state update
- Check modal z-index

### Routes not working?
- Verify imports in App.jsx
- Check route paths
- Ensure BrowserRouter wraps App

---

## Production Deployment

### Build
```bash
npm run build
```

### Deploy
- Build output: `dist/` folder
- Host on Vercel, Netlify, AWS S3, etc.
- Set `VITE_API_BASE_URL` environment variable
- Enable CORS on backend for production domain

### Checklist
- [ ] API endpoints deployed
- [ ] Environment variables set
- [ ] CORS configured
- [ ] SSL certificate installed
- [ ] Analytics configured
- [ ] Error tracking enabled
- [ ] Monitoring set up

---

**Status**: ✅ Ready for Development
**Last Updated**: 2024
**Version**: 1.0.0
