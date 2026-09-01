Learnings

Random notes on things I install/use in this project, explained simply so future me doesn't forget why they're here.

📦 Packages
🚂 express

The framework that runs the backend server. Handles routes (like /api/appointments), requests, and responses. Basically the skeleton of the whole backend.

🍃 mongoose

A helper library that talks to MongoDB for me. Instead of writing raw database queries, I define "schemas" (shapes of my data, like what a Doctor or Patient looks like) and mongoose handles saving/fetching that data.

📁 multer

Used for handling file uploads (like when a user uploads a profile picture or a medical document). Without it, Express can't read files sent in a form.

🔐 bcrypt

Used to hash passwords before saving them to the database. Never store plain text passwords — bcrypt scrambles them so even I can't see the real password.

☁️ cloudinary

A cloud service to store images/files (like profile pics). Instead of saving files on my own server, I upload them to Cloudinary and just store the link in my database.

🌐 cors

Short for Cross-Origin Resource Sharing. My frontend and backend run on different ports/URLs, so by default the browser blocks them from talking to each other. This package allows that connection safely.

🤫 dotenv

Lets me keep secret stuff (API keys, database URL, passwords) in a .env file instead of hardcoding them in my actual code. Keeps secrets out of GitHub.

🎫 jsonwebtoken (JWT)

Used for login/authentication. When a user logs in, I give them a token (like a digital ID card). They send this token back on future requests so the server knows who they are without asking for the password again and again.

🔄 nodemon

A dev tool that auto-restarts my server every time I save a file. Saves me from manually stopping and restarting node server.js every single time.

✅ validator

A library with ready-made functions to check if data is valid — like checking if an email is actually an email, or if a string isn't empty. Saves me from writing my own validation logic from scratch.
---

## 💡 Why is `"type": "module"` necessary in `package.json`?

Node.js supports **two module systems**, and this setting decides which one it expects.

### 🔹 CommonJS — Traditional Node.js

Uses `require()` and `module.exports`.

```js
const express = require("express");

module.exports = router;
```

### 🔹 ES Modules — What we're using

Uses `import` and `export`.

```js
import express from "express";

export default router;
export { registerUser, loginUser };
```

> 💡 **Why `"type": "module"`?**
>
> Adding `"type": "module"` tells Node.js to treat our `.js` files as **ES Modules**, so `import` / `export` works correctly.
>
> Without it, Node.js treats `.js` files as **CommonJS** by default.

---

🗂️ Folder Structure
⚙️ config

Holds setup/configuration code — stuff like connecting to MongoDB or setting up Cloudinary. Basically "one-time setup" files that other parts of the app rely on.

🎮 controller

The "brain" of each route. When a request comes in, the route sends it here, and the controller decides what to actually do (fetch data, save data, send a response, etc).

🛡️ middlewares

Functions that run in between the request coming in and the controller handling it. Used for stuff like checking if a user is logged in (auth) before letting them proceed.

🗄️ models

Defines the "shape" of data using mongoose schemas — like what fields a Doctor, Patient, or Appointment has in the database.

🛣️ routes

Defines the actual API endpoints (like /api/doctors or /api/appointments) and connects each one to the right controller function.

Concepts / Doubts
Why is "type": "module" necessary in package.json?

Node.js supports two module systems, and this setting decides which one it expects:

CommonJS (old, default in Node) — import with require(), export with module.exports.
js
  const express = require("express");
  module.exports = router;
ES Modules (new, what we're using) — import with import, export with export default or export { }.
js
  import express from "express";
  export default router;
  export { registerUser, loginUser };

Adding "type": "module" tells Node to treat our .js files as ES Modules, so import/export works instead of throwing an error. Without it, Node assumes CommonJS by default.

---

## 🧩 Why are `express.json()` and `cors()` used as middleware?

### 🔹 `express.json()`

`express.json()` allows Express to **read JSON data sent in the request body** and makes it available through `req.body`.

```js
app.use(express.json());
```

Without it, when the frontend sends JSON data, Express may not be able to read `req.body` properly.

### 🔹 `cors()`

`cors()` allows the frontend and backend to **communicate with each other even when they are running on different origins** (for example, different ports).

```js
app.use(cors());
```

For example:

```text
Frontend → localhost:5173
Backend  → localhost:4000
```

Since these are different origins, CORS allows the browser to accept requests between them.

---

---

## 🧩 Why do we use `minimize: false` with an empty object?

Consider this Mongoose schema:

```js
slots_booked: {
    type: Object,
    default: {}
}
```

### 🔹 `default: {}`

`default: {}` means that if no value is provided for `slots_booked`, Mongoose gives it an **empty object** by default.

```js
slots_booked: {}
```

So when a new doctor is created, initially there are no booked appointment slots.

### 🔹 Why do we need `minimize: false`?

By default, Mongoose uses:

```js
minimize: true
```

This means Mongoose **removes empty objects when saving the document**.

For example:

```js
slots_booked: {}
```

may be removed before the document is stored in MongoDB.

To tell Mongoose to **keep the empty object**, we use:

```js
{
    minimize: false
}
```

Now:

```js
slots_booked: {}
```

will actually be preserved in the MongoDB document.

### 🧠 Easy Way to Remember

```text
default: {}
      ↓
Creates the empty object

minimize: false
      ↓
Prevents Mongoose from removing the empty object
```

> ⭐ **`default: {}` creates the empty object, while `minimize: false` tells Mongoose to preserve that empty object in MongoDB.**

---