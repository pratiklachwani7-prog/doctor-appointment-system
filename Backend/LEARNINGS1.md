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
### 🩺 Why are only some schema fields destructured from `req.body` in the controller?

The **schema** defines everything a Doctor document *can* hold. The **controller** only pulls from `req.body` the fields the *frontend actually sends*:

```js
const { name, email, password, speciality, degree, experience, about, fees, address } = req.body;
```

The rest come from elsewhere and get added manually before saving:
| Field | Comes from |
|---|---|
| `image` | file upload (multer/cloudinary) |
| `available` | backend sets it, e.g. `true` |
| `date` | backend generates it, `new Date()` |
| `slots_booked` | schema `default: {}` |

**Key idea:** schema = what a document *can* contain. Controller = where each piece of data actually *comes from*. Not every schema field needs to be destructured from `req.body`.

---

## How did the Multer MiddleWare Came into the Picture

## 📝 Why do we need `multipart/form-data` for file uploads?

### 🔹 The Problem

Normally, the frontend can send data as **JSON**:

```json
{
  "name": "Dr. Rahul",
  "email": "rahul@gmail.com",
  "fees": 500
}
```

Express can read this using:

```js
app.use(express.json());
```

But our Doctor form also contains an **image/file**.

A real file cannot be sent as normal JSON data.

### 🔹 So what do we use?

For a form containing **normal fields + files**, the frontend sends the request as:

```text
multipart/form-data
```

It can carry both:

```text
name        → "Dr. Rahul"
email       → "rahul@gmail.com"
fees        → 500
image       → doctor.jpg 📸
```

### 🔹 JSON vs `multipart/form-data`

| JSON | multipart/form-data |
|---|---|
| Used for normal structured data | Used for forms containing files |
| Easy to send text/numbers/objects | Can send text + files |
| Read using `express.json()` | Requires a multipart parser such as Multer |
| ❌ Not suitable for actual file uploads | ✅ Suitable for file uploads |

### 🔹 Why did Multer enter our project?

Our Doctor form contains an **image**, so the frontend will send the request using:

```text
multipart/form-data
```

Express does not automatically process the uploaded file from this format.

Therefore, we use **Multer middleware** to process the incoming file before the request reaches our controller.

### 🔹 Request Flow

```text
Frontend Doctor Form
        ↓
multipart/form-data
        ↓
   Middleware
        ↓
      Multer
        ↓
   Controller
        ↓
    MongoDB
```

### ⭐ Remember

> **JSON → normal data 📦**

> **multipart/form-data → normal data + files 📦📸**

> **Multer → processes the uploaded files before the controller handles the request.**

---

### 📸 How does `multer.diskStorage` + `upload.single()` actually work?

```js
const storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, file.originalname)
    }
})
const upload = multer({ storage })
```

- `{ storage }` isn't destructuring — it's **shorthand** for `{ storage: storage }`. We're *building* an object, not unpacking one. 📦
- The `callback` isn't ours — **multer creates and calls it internally**, we just get handed it as an argument. This is the classic Node **error-first callback** pattern: `callback(error, result)`. `callback(null, file.originalname)` = "no error 🚫, use this filename ✅".
- `multer({ storage })` gives back an `upload` object with methods like:
  - `.single("field")` → expects **one file** 📄
  - `.array("field", max)` → expects **multiple files**, same field 📚
  - `.fields([...])` → multiple files, **different fields** 🗂️
  - `.none()` → **no files**, just text ✍️
- After `upload.single("image")` runs, the file shows up on `req.file` (`req.file.originalname`, `req.file.path`, etc.) ready to use in the controller.look for a file sent under the form field name image, process it using the storage config, then attach the result to req.file, and pass control to the next function (registerDoctor). 🎉

> ⚠️ Using raw `file.originalname` can overwrite files with the same name — safer to prefix: `Date.now() + "-" + file.originalname`.

---

### 🔄 How does the "Add Doctor" request flow from route to controller?

This one confused me at first because there are multiple files involved and it's not obvious how a single request passes through all of them. Breaking it down piece by piece:

**1. The route file** — `admin.route.js`
```js
import express from "express";
import { addDoctor } from "../controller/adminController";
import upload from "../middlewares/multer";

const adminRouter = express.Router();

adminRouter.post("/add-doctor", upload.single("image"), addDoctor);

export default adminRouter;
```
Here, `adminRouter` is a mini "sub-router" — it only knows about the `/add-doctor` route for now, but it can hold many more admin-related routes later. Notice that `.post()` takes **three arguments**: the path, then `upload.single("image")`, then `addDoctor`. In Express, you can chain multiple functions like this — they run **in order, left to right**, and each one has to explicitly pass control to the next (that's what middleware does).

**2. Registering the router** — `server.js`
```js
app.use("/api/admin", adminRouter);
```
This is the connection point between your main server and this router file. It tells Express: *"any request whose URL starts with `/api/admin`, hand it over to `adminRouter` to figure out the rest."* The main server doesn't need to know about `/add-doctor` specifically — it just delegates.

**3. Putting the full URL together**
When your frontend (or Postman) sends:


---

### 🔐 How does password hashing with bcrypt actually work?

```js
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);
```

We never store a user's actual password in the database — if the database ever leaked, every password would be exposed instantly. Instead, we store a **hashed** (scrambled) version that can't be reversed back into the original.

**1. `bcrypt.genSalt(10)` — generating a "salt"**
A **salt** is a random string of characters bcrypt mixes into the password *before* hashing it. Why bother? Because if two users pick the same password (`"123456"`), hashing it plainly would produce the *same* hash for both — making it easier for attackers to spot patterns or use precomputed hash tables ("rainbow tables") to crack it. Adding a random salt means even identical passwords produce **completely different hashes**.

The `10` passed in is the **number of hashing rounds** (also called the "cost factor"). It controls how computationally expensive the hashing process is:
- Higher number → slower to compute → harder to brute-force → but also slower for your server to process on every signup/login.
- Lower number → faster but weaker.
- `10` is a commonly used, reasonable default (values usually range 5–50, but very high values make even legitimate logins noticeably slow).

**2. `bcrypt.hash(password, salt)` — actually hashing it**
This takes the plain-text `password` and combines it with the `salt` generated above, running it through bcrypt's hashing algorithm. The result, `hashedPassword`, is a long scrambled string that:
- **Cannot be decrypted back** into the original password (hashing is one-way, unlike encryption).
- Will always produce the same output for the same password + salt, but a *different* output for the same password with a *different* salt.
- Actually has the salt embedded inside the final hash string itself, so bcrypt doesn't need to store the salt separately — this is why we only save `hashedPassword` to the database, not `salt` on its own.

**3. How login later verifies the password**
Since hashing can't be reversed, login doesn't "decrypt" the stored hash — instead it re-hashes the password the user just typed in (using the same salt bcrypt extracts from the stored hash) and **compares the two hashes**:
```js
const isMatch = await bcrypt.compare(enteredPassword, hashedPasswordFromDB);
```
If they match, the password was correct.

🧠 **Golden rule to remember:** Never store plain passwords → generate a salt → hash password + salt → store only the hash → verify future logins by comparing hashes, never by decrypting.

---

### 🖼️ How does the uploaded image travel from `req.file` → Cloudinary?

**1. What is `req.file`?**
- Multer's `upload.single("image")` runs *before* the controller and attaches uploaded file info to `req.file`.
- It's an object with fields like:
  - `fieldname` → form field name (`"image"`)
  - `originalname` → filename on the user's computer
  - `mimetype` → type of file
  - `path` → **where Multer temporarily saved the file on the server's disk**
  - `filename`, `destination`, `size` → self-explanatory

**2. What is `imageFile`?**
- Just a shorter local variable name: `const imageFile = req.file`
- Same object, nothing new happening — just renamed for readability.

**3. Why can't we just keep the file where Multer put it?**
- It's only in a **temporary local folder** on the server (e.g. `Temp\img13.jpg`).
- Not permanent — gone if server restarts or temp folder clears.
- No public URL — can't be displayed on a website from there.
- Many hosting platforms don't even keep local files persistently after deploy.
- 👉 So Multer = temporary receiver, Cloudinary = permanent storage.

**4. `cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })`**
- `imageFile.path` → tells Cloudinary *where to read the file from* (the local temp path Multer saved).
- `{ resource_type: "image" }` → tells Cloudinary what kind of file this is.
- `await` → it's a network request, so we wait for it to finish.
- Returns `imageUpload`, containing:
  - `imageUpload.secure_url` → public HTTPS URL of the uploaded image
  - `imageUpload.public_id` → Cloudinary's internal ID for the file

**5. What actually gets saved to MongoDB?**
- We save `imageUpload.secure_url` (the Cloudinary link) into the doctor's `image` field.
- ❌ Never save the local `path` — it only exists on the server's machine and means nothing to anyone else.

**Full journey, step by step:**
```
User selects image → Frontend sends multipart/form-data
        ↓
Multer intercepts → saves temporarily → req.file (with .path)
        ↓
Controller: imageFile = req.file
        ↓
cloudinary.uploader.upload(imageFile.path, ...)
        ↓
Cloudinary stores it permanently → returns secure_url
        ↓
secure_url saved in MongoDB as doctor's "image" field ✅
```