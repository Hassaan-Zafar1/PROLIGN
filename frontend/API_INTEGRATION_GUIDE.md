# API Integration Quick Reference

## Mock Data to Real API Conversion

This guide shows exactly where to replace mock data with real API calls in each file.

---

## 1. Landing Page (`src/pages/Landing.jsx`)

### Replace Feature Cards
```javascript
// CURRENT (Mock Data)
{FEATURES.map((feature) => (...))}

// TODO: Replace with API
useEffect(() => {
  fetch('/api/features')
    .then(res => res.json())
    .then(data => setFeatures(data))
}, []);
```

### Replace Steps Section
```javascript
// CURRENT (Mock Data)
{STEPS.map((step) => (...))}

// TODO: Replace with API
useEffect(() => {
  fetch('/api/steps')
    .then(res => res.json())
    .then(data => setSteps(data))
}, []);
```

### Replace Testimonials
```javascript
// CURRENT (Mock Data)
{TESTIMONIALS.map((testimonial) => (...))}

// TODO: Replace with API
useEffect(() => {
  fetch('/api/testimonials')
    .then(res => res.json())
    .then(data => setTestimonials(data))
}, []);
```

---

## 2. Login Page (`src/pages/Login.jsx`)

### Replace Authentication Logic
```javascript
// CURRENT (Mock)
const user = MOCK_USERS.find(u => u.email === email && u.password === password);

// TODO: Replace with API
const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error((await response.json()).message);
    }

    const data = await response.json();
    
    // Store authentication
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Redirect based on role
    navigate(`/${data.user.role}-dashboard`);
  } catch (err) {
    setError(err.message);
  }
};
```

---

## 3. Mentee SignUp (`src/pages/SignUp.jsx`)

### Replace Registration
```javascript
// CURRENT (Mock)
setOtpOpen(true);

// TODO: Replace with API
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const response = await fetch('/api/auth/register-mentee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        careerGoals: formData.careerGoals,
        industry: formData.industry,
        experience: formData.experience,
        skills: formData.skills,
        budget: formData.budget
      })
    });

    if (!response.ok) {
      throw new Error((await response.json()).message);
    }

    const data = await response.json();
    // Proceed with OTP verification
    setOtpOpen(true);
  } catch (err) {
    setErrors({ submit: err.message });
  }
};
```

### Replace Industry Dropdown
```javascript
// CURRENT (Mock Data)
{INDUSTRIES.map((industry) => (...))}

// TODO: Replace with API
useEffect(() => {
  fetch('/api/industries')
    .then(res => res.json())
    .then(data => setIndustries(data))
}, []);
```

### Replace OTP Verification
```javascript
// CURRENT (Mock)
setOtpOpen(false);
setSuccessOpen(true);

// TODO: Replace with API
const handleOTPVerify = async (otpCode) => {
  try {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        otp: otpCode
      })
    });

    if (!response.ok) {
      throw new Error((await response.json()).message);
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    setOtpOpen(false);
    setSuccessOpen(true);
  } catch (err) {
    setErrors({ otp: err.message });
  }
};
```

---

## 4. Mentor Registration (`src/pages/MentorRegistration.jsx`)

### Replace Mentor Registration
```javascript
// CURRENT (Mock)
setOtpOpen(true);

// TODO: Replace with API
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const formDataToSend = new FormData();
    formDataToSend.append('fullName', formData.fullName);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('password', formData.password);
    formDataToSend.append('linkedinUrl', formData.linkedinUrl);
    formDataToSend.append('expertise', JSON.stringify(formData.expertise));
    formDataToSend.append('yearsOfExperience', formData.yearsOfExperience);
    formDataToSend.append('hourlyRate', formData.hourlyRate);
    
    if (formData.cvFile) {
      formDataToSend.append('cvFile', formData.cvFile);
    }

    const response = await fetch('/api/auth/register-mentor', {
      method: 'POST',
      body: formDataToSend  // Don't set Content-Type, browser will set it
    });

    if (!response.ok) {
      throw new Error((await response.json()).message);
    }

    setOtpOpen(true);
  } catch (err) {
    setErrors({ submit: err.message });
  }
};
```

---

## 5. Mock Data File (`src/constants/mockData.js`)

### Add API Fetch Functions
```javascript
/**
 * Authentication API Functions
 * TODO: Update base URL and authentication headers
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
}

export async function registerMentee(formData) {
  const response = await fetch(`${API_BASE_URL}/auth/register-mentee`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  return response.json();
}

export async function registerMentor(formData) {
  const response = await fetch(`${API_BASE_URL}/auth/register-mentor`, {
    method: 'POST',
    body: formData  // Use FormData for file upload
  });
  return response.json();
}

export async function verifyOTP(email, otp) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });
  return response.json();
}

export async function resendOTP(email) {
  const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return response.json();
}
```

---

## Complete API Endpoints Checklist

### Authentication
- [ ] `POST /api/auth/login` - Login
- [ ] `POST /api/auth/register-mentee` - Mentee registration
- [ ] `POST /api/auth/register-mentor` - Mentor registration
- [ ] `POST /api/auth/verify-otp` - Verify OTP
- [ ] `POST /api/auth/resend-otp` - Resend OTP
- [ ] `POST /api/auth/logout` - Logout
- [ ] `POST /api/auth/forgot-password` - Password reset

### Data Fetching
- [ ] `GET /api/features` - Features list
- [ ] `GET /api/steps` - Steps/process list
- [ ] `GET /api/testimonials` - Testimonials list
- [ ] `GET /api/industries` - Industries dropdown
- [ ] `GET /api/experience-levels` - Experience levels
- [ ] `GET /api/expertise-tags` - Expertise tags

### User Management
- [ ] `GET /api/user/profile` - Get current user
- [ ] `PUT /api/user/profile` - Update profile
- [ ] `GET /api/user/settings` - User settings
- [ ] `PUT /api/user/settings` - Update settings

### Mentorship
- [ ] `GET /api/mentors` - Browse mentors
- [ ] `GET /api/mentors/:id` - Mentor details
- [ ] `POST /api/mentors/:id/book` - Book session
- [ ] `GET /api/sessions` - User sessions
- [ ] `GET /api/sessions/:id` - Session details
- [ ] `POST /api/sessions/:id/message` - Send message
- [ ] `GET /api/sessions/:id/messages` - Get messages

### Admin
- [ ] `GET /api/admin/applications` - Pending applications
- [ ] `POST /api/admin/applications/:id/approve` - Approve mentor
- [ ] `POST /api/admin/applications/:id/reject` - Reject mentor

---

## Environment Variables

Create `.env` file in frontend directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=MentorBridge
VITE_APP_VERSION=1.0.0
```

Access in code:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

---

## Common API Response Formats

### Successful Login
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "mentee",
    "profileComplete": true
  }
}
```

### Successful Registration
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "userId": "user_456",
  "email": "neuser@example.com",
  "role": "mentee"
}
```

### OTP Verification
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid email or password",
  "error": "INVALID_CREDENTIALS",
  "statusCode": 401
}
```

---

## Error Handling Pattern

```javascript
const handleApiCall = async () => {
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'An error occurred');
    }

    // Success
    return result;
  } catch (err) {
    // Handle error
    setErrors({ submit: err.message });
    console.error('API Error:', err);
  }
};
```

---

## Testing API Integration

1. Start mock backend (if available)
2. Set `VITE_API_BASE_URL` in `.env`
3. Update one component at a time
4. Test form submission
5. Verify data flow
6. Check localStorage updates
7. Test error scenarios
8. Move to next component

---

## Debugging Tips

- Open DevTools → Network tab
- Check request headers and body
- Verify response status codes
- Log API responses to console
- Use Postman for endpoint testing
- Check browser console for errors
- Verify CORS settings on backend

---

Last Updated: 2024
