// Vercel's Node function hosts the existing backend without opening a TCP port.
// Business logic and database access remain in backend/.
export { app as default } from "../backend/src/app.js";
