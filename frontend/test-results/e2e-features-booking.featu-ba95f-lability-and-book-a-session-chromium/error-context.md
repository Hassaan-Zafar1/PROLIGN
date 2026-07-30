# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\features\booking.feature.spec.js >> Booking a session (logged-in mentee) >> Mentee can browse a mentor's availability and book a session
- Location: e2e\.features-gen\e2e\features\booking.feature.spec.js:6:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /\d{1,2}:\d{2}\s?(AM|PM)\s*-\s*\d{1,2}:\d{2}\s?(AM|PM)/i }).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /\d{1,2}:\d{2}\s?(AM|PM)\s*-\s*\d{1,2}:\d{2}\s?(AM|PM)/i }).first()

```

```yaml
- main:
  - heading "Book a Session" [level=1]
  - img "E2E Mentor 1785352112346.1807's avatar"
  - heading "E2E Mentor 1785352112346.1807" [level=3]
  - paragraph
  - text: "0"
  - paragraph: $50
  - paragraph: per session
  - paragraph: "60"
  - paragraph: minutes
  - heading "Booking Summary" [level=4]
  - text: Mentor E2E Mentor 1785352112346.1807 Date Thu, Jul 30 Time — Duration 60 min Session Fee $50.00 Platform Fee $2.50 Total $52.50
  - button "chevron_left" [disabled]
  - heading "July 2026" [level=4]
  - button "chevron_right"
  - text: Su Mo Tu We Th Fr Sa
  - button "1" [disabled]
  - button "2" [disabled]
  - button "3" [disabled]
  - button "4" [disabled]
  - button "5" [disabled]
  - button "6" [disabled]
  - button "7" [disabled]
  - button "8" [disabled]
  - button "9" [disabled]
  - button "10" [disabled]
  - button "11" [disabled]
  - button "12" [disabled]
  - button "13" [disabled]
  - button "14" [disabled]
  - button "15" [disabled]
  - button "16" [disabled]
  - button "17" [disabled]
  - button "18" [disabled]
  - button "19" [disabled]
  - button "20" [disabled]
  - button "21" [disabled]
  - button "22" [disabled]
  - button "23" [disabled]
  - button "24" [disabled]
  - button "25" [disabled]
  - button "26" [disabled]
  - button "27" [disabled]
  - button "28" [disabled]
  - button "29" [disabled]
  - button "30" [disabled]
  - button "31" [disabled]
  - heading "Available Times" [level=4]
  - paragraph: Thu, Jul 30
  - text: progress_activity Loading slots...
  - heading "Session Details" [level=4]
  - text: Topic
  - textbox "e.g. Career guidance, Resume review"
  - text: Goals (Optional)
  - textbox "What would you like to discuss?"
  - button "Continue to Payment"
  - button "Back"
- button "Open AI chat assistant":
  - text: AI
  - img "ProLign AI"
- img "ProLign AI"
- heading "ProLign AI" [level=2]
- paragraph: Wisdom Engine
- button "history"
- button "close"
- img "ProLign AI"
- paragraph: Hello! I'm your ProLign AI assistant. I can help you refine your resume, practice for interviews, or explore new career paths. What's on your mind today?
- text: 12:08 AM
- button "Help with resume"
- button "Interview prep"
- button "Career advice"
- button "Summarise our chat"
- textbox "Message ProLign AI..."
- button "send"
- region "Notifications Alt+T"
```

```
Tearing down "context" exceeded the test timeout of 30000ms.
```