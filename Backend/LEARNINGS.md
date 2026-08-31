# Learnings

Random notes on things I install/use in this project, explained simply so future me doesn't forget why they're here.

## Packages

### express
The framework that runs the backend server. Handles routes (like `/api/appointments`), requests, and responses. Basically the skeleton of the whole backend.

### mongoose
A helper library that talks to MongoDB for me. Instead of writing raw database queries, I define "schemas" (shapes of my data, like what a Doctor or Patient looks like) and mongoose handles saving/fetching that data.

### multer
Used for handling file uploads (like when a user uploads a profile picture or a medical document). Without it, Express can't read files sent in a form.

### bcrypt
Used to hash passwords before saving them to the database. Never store plain text passwords — bcrypt scrambles them so even I can't see the real password.

### cloudinary
A cloud service to store images/files (like profile pics). Instead of saving files on my own server, I upload them to Cloudinary and just store the link in my database.

### cors
Short for Cross-Origin Resource Sharing. My frontend and backend run on different ports/URLs, so by default the browser blocks them from talking to each other. This package allows that connection safely.

### dotenv
Lets me keep secret stuff (API keys, database URL, passwords) in a `.env` file instead of hardcoding them in my actual code. Keeps secrets out of GitHub.

### jsonwebtoken (JWT)
Used for login/authentication. When a user logs in, I give them a token (like a digital ID card). They send this token back on future requests so the server knows who they are without asking for the password again and again.

### nodemon
A dev tool that auto-restarts my server every time I save a file. Saves me from manually stopping and restarting `node server.js` every single time.

### validator
A library with ready-made functions to check if data is valid — like checking if an email is actually an email, or if a string isn't empty. Saves me from writing my own validation logic from scratch.

---
*(Will keep adding more notes here as I learn new things throughout the project.)*