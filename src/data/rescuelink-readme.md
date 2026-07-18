RescueLink — Emergency Response System
Built after the 2023 Himachal Pradesh floods where people lost their lives because emergency services couldn't locate victims in time.

Live Demo: rescue-link-three.vercel.app
Backend: rescuelink-backend.onrender.com

The Problem
In July 2023, catastrophic floods hit Himachal Pradesh. People were stranded, roads were cut off, and communication networks were severely damaged. Many victims couldn't reach emergency services — and even when they did, rescuers had no way to locate them precisely.

I watched this happen and thought: there has to be a better way.

RescueLink is my answer to that problem.

What It Does
Two types of users, one shared mission:

Victims (no login required)
Hit the SOS button in seconds — no signup friction during an emergency
Share emergency type, contact number, and live location
Get redirected to a tracking page showing their rescuer moving towards them in real time
Rescuers / NGOs (authenticated)
See all active emergencies on a live map dashboard
Accept emergencies with race-condition-safe atomic operations
Share live location with victim while navigating to them
Mark emergencies as resolved
Demo Flow
1. Open app as victim → hit SOS → fill details → submit
2. Open dashboard as rescuer → see alert appear in real time
3. Accept emergency → both victim and rescuer see each other on map
4. Rescuer navigates to victim → resolves emergency
5. Victim sees "Help has arrived!" on tracking page
Tech Stack
The frontend uses React + Vite, chosen for fast development and component reuse.
Styling is done with Tailwind CSS for rapid UI development without custom CSS.
Maps use Leaflet + React-Leaflet, an open-source choice with no API key cost.
Real-time communication uses Socket.io for native WebSocket support and rooms.
The backend is built with Node.js + Express 5, event-driven and suited for real-time apps.
The database is MongoDB + Mongoose, chosen for geospatial indexing (2dsphere).
Authentication uses JWT, which is stateless and works across web and mobile.
Validation is handled with Joi for schema-based input checking.
Security uses Helmet and rate limiting for production hardening.
Deployment uses Vercel and Render, both free-tier with auto-deploy from GitHub.

Socket Rooms Strategy
Each emergency gets its own isolated Socket.io room alert:${alertId}. This means:

Rescuer's live location is only sent to their assigned victim
Not broadcasted to all users
Privacy + performance — no unnecessary events
Key Engineering Decisions
1. Race Condition Prevention
Two rescuers accepting the same emergency simultaneously is a real scenario. Solved with MongoDB's atomic findOneAndUpdate:

// Only succeeds if status is STILL "active" at query time
// MongoDB processes this atomically — one rescuer wins, other gets null
const alert = await Alert.findOneAndUpdate(
  { _id: id, status: "active" },
  { status: "acknowledged", acceptedBy: rescuerId },
  { new: true }
);
2. No Auth for Victims
Deliberately chose NOT to require login for SOS submission. During a flood or medical emergency, asking someone to create an account costs lives. Rescuers authenticate — victims don't.

3. Live Location at 5-Second Intervals
// Industry standard (same as Uber, Zomato)
// Accurate enough for emergency navigation
// Battery friendly — not watchPosition which fires 10-20x/sec
 
4. JWT Over Cookies
Chose Bearer tokens in Authorization headers because the app is designed to eventually support mobile clients. Cookies work well for browser-only apps but JWT works across web, mobile, and API clients.

5. Geospatial Indexing
alertSchema.index({ location: "2dsphere" });
// Enables efficient "find alerts near me" queries
// Critical for scaling to city/state level
Running Locally
Backend
git clone https://github.com/Shubham043/RescueLink_Backend
cd RescueLink_Backend
npm install
Create .env:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
ALLOWED_ORIGINS=http://localhost:5173
PORT=8000
npm start
Frontend
git clone https://github.com/Shubham043/RescueLink_Frontend
cd RescueLink_Frontend
npm install
Create .env:

VITE_API_ENV=local
VITE_LOCAL_HOST=http://localhost:8000
VITE_HOSTED_URL=https://rescuelink-backend.onrender.com
npm run dev
Roadmap
 PWA + offline SOS submission (service workers + background sync)
 SMS fallback via Twilio — works with no internet, just one text
 Max active acceptances per rescuer (limit to 3)
 Auto-release if rescuer goes offline after accepting
 HttpOnly cookies for better XSS protection
 Live location history trail on map
 NDRF / State disaster management API integration
Why I Built This
I'm from Himachal Pradesh. In 2023 I watched the floods destroy homes, roads, and lives. The thing that stayed with me wasn't the destruction — it was the helplessness. People knew help existed but couldn't connect with it fast enough.

RescueLink is my attempt to close that gap. It's not just a portfolio project — it's a problem I actually want to solve.

Author
Shubham — Full Stack Developer from Himachal Pradesh
GitHub

Built with the hope that no one in Himachal — or anywhere — dies because help couldn't find them.