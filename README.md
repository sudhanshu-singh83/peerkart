# PeerKart - GLBITM campus marketplace
React + Express + MongoDB (Mongoose). JWT login, college-email OTP, image uploads, reports, admin dashboard.

## Run locally
1. Install Node 18+ and MongoDB (local or Atlas).
2. Backend:
   cd server && npm install && cp .env.example .env   (fill in MONGO_URI, JWT_SECRET, SMTP_*, SEMESTER_END_DATE)
   npm run seed     (creates admin + 2 demo students + demo listings)
   npm run dev
3. Frontend (new terminal):
   cd client && npm install && npm run dev      -> http://localhost:5173
Seeded logins: admin = ADMIN_EMAIL / ADMIN_PASSWORD from .env; students student1@glbitm.ac.in / Student123.

## OTP email
Real SMTP is required. For Gmail: enable 2-step verification, create an App Password, use smtp.gmail.com / 587.
Without SMTP settings the "Send OTP" call returns a clear "Email is not configured" error - no fake OTPs exist.
(Seeded accounts let you test everything else without email.)

## Manual test checklist
- Register with a non-@glbitm.ac.in email -> rejected. Valid email -> OTP mail -> wrong OTP rejected, 5 wrong tries lock it, expires in 10 min, resend after 60s.
- Create / edit / delete / mark-sold listings; sold ones vanish from Home.
- Search + category + price filters together.
- Open another student's listing edit URL or call PUT/DELETE with their token -> 403.
- Student token on /api/admin/* -> 403.
- Set SEMESTER_END_DATE to a past date on seeded data (or edit expiresAt in Mongo) -> listings become "expired" on next fetch.
- Report a listing -> admin dashboard -> Resolve or Remove Listing.
- Restart server and refresh: data persists in MongoDB.

## Deployment
- Database: MongoDB Atlas free cluster; put its URI in MONGO_URI.
- Backend on Render: root dir `server`, build `npm install`, start `npm start`; add all .env variables, CLIENT_URL = your Vercel URL.
  Render's disk is not permanent, so uploaded photos are lost on redeploy. For real use, swap the storage in server/middleware/upload.js for Cloudinary.
- Frontend on Vercel: root dir `client`, build `npm run build`, output `dist`; set VITE_API_URL to the Render URL.
  Add a vercel.json rewrite of all paths to /index.html so page refreshes work with React Router.

## Structure
server/ models, routes, middleware, config.js, seed.js   |   client/src/pages one file per screen
