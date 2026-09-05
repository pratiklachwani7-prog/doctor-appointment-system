# 🔐 What is a JWT Token and why is it useful?

A **JWT (JSON Web Token)** is a signed token that the server gives to a user after successful login. The client sends this token with future requests to prove that the user is authenticated.

## 🎟️ Creating a JWT Token

    const token = jwt.sign(email + password, process.env.JWT_SECRET);

Here:

- `email + password` → the data being placed inside the token.
- `process.env.JWT_SECRET` → the secret key used by the server to sign the token.
- `jwt.sign()` → creates the JWT token.

## 🔄 Why is the Token Useful?

After a successful login:

    User
      ↓
    Email + Password
      ↓
    Login API
      ↓
    Credentials verified ✅
      ↓
    JWT Token created
      ↓
    Token sent to frontend

For future protected requests:

    Frontend
      ↓
    Sends JWT Token
      ↓
    Backend
      ↓
    Verifies JWT using JWT_SECRET
      ↓
    User authenticated ✅
      ↓
    Access granted to protected API

The main benefit is that the user does **not need to send their email and password with every request**.

## 🧠 Example

Suppose a user successfully logs in.

The server generates a JWT and sends it to the frontend.

Later, when the user requests:

    GET /api/user/profile

The frontend sends the JWT with the request.

The backend verifies it using:

    jwt.verify(token, process.env.JWT_SECRET);

If the token is valid → the request can continue.

If the token is invalid or has been modified → the backend can reject the request.

## ⚠️ Important

JWTs are generally used for **authentication**, not for hiding sensitive information.

Also, we should **never put the user's plain-text password into a JWT**.

A better approach is to store a user identifier such as the user's `_id` in the token:

    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET
    );

The backend can then use the ID from the token to identify the authenticated user.

---

# 🔐 Admin Authentication — Learning Notes

## 1. Why do we create `authAdmin` / an authentication middleware for the admin?

Even though the **admin email and password are secure**, we should NOT send the admin email and password with every request.

The password is only used during **login**.

The flow is:

1. Admin enters email + password.
2. Server verifies the credentials.
3. Server generates a JWT token.
4. Admin receives the token.
5. For every protected admin API request, the token is sent.
6. `authAdmin` middleware verifies the token.
7. If the token is valid → request continues to the controller.
8. If the token is missing/invalid → request is rejected.

So, `authAdmin` is basically the **security guard** for protected admin routes.

Example:

    adminRouter.post("/add-doctor", authAdmin, upload.single("image"), addDoctor);

Here:

    Request
       ↓
    authAdmin
       ↓
    Is JWT valid?
       ↓
    YES → addDoctor()
    NO  → Reject request

### Why not just check the email and password?

Because that would mean sending the admin's password again and again.

Instead:

    Password → used only during LOGIN
    JWT     → used for subsequent authenticated requests

This is safer and more efficient.

---

## 2. Why is the token sent in `req.headers` and not `req.body`?

The JWT token is normally sent in the **HTTP Authorization header** because the token represents the **authentication information of the request**, not the actual data that the API is processing.

The standard format is:

    Authorization: Bearer <token>

Example:

    Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

The backend can then read it using:

    req.headers.authorization

### Why not `req.body.token`?

The request body is generally meant for the **data being sent to the API**.

For example, when creating a doctor:

    {
        "name": "Dr. Rahul",
        "email": "rahul@gmail.com",
        "fees": 500
    }

That is the actual data the API needs.

The JWT is different. It tells the server:

    "Who is making this request, and are they authenticated?"

Therefore, authentication information is placed in the **HTTP headers**.

### Another important reason

Some requests, especially `GET` requests, normally don't have a request body.

For example:

    GET /api/admin/doctors

But we still need to authenticate this request.

So we can send:

    GET /api/admin/doctors
    Authorization: Bearer <token>

This allows authentication to work independently of the request body.

---

## ⭐ Remember

    Login:
    Email + Password
           ↓
        Verify
           ↓
       JWT Token

    Protected API:
    JWT Token
       ↓
    authAdmin
       ↓
    Verify Token
       ↓
    Controller

### Simple rule:

**Password → only for login**

**JWT → proves authentication after login**

**`Authorization` header → carries the JWT**

**`authAdmin` middleware → verifies the JWT before allowing access**


---
### Discussion of JWT Token and Cookies
# 🔐 Admin Authentication — JWT, Cookies & Middleware

We are currently building an **Admin Authentication system**.

The overall idea is:

    Admin
      ↓
    Login with Email + Password
      ↓
    Controller verifies credentials
      ↓
    Controller creates JWT
      ↓
    JWT is sent to the client
      ↓
    Client stores/sends JWT
      ↓
    Admin requests protected APIs
      ↓
    Authentication Middleware verifies JWT
      ↓
    If valid → allow request
    If invalid/missing → reject request


# 1. First understand what we are building

In VS Code, we are mainly creating two important parts:

    Controller
    Middleware

The **controller** handles the actual operation.

For example:

    loginAdmin()
    addDoctor()

The **middleware** runs before the controller when we want to perform some common check.

For example:

    authAdmin

Its job is to answer:

    "Is this request coming from an authenticated admin?"

So:

    loginAdmin → creates authentication
    authAdmin  → verifies authentication


# 2. What happens when the admin logs in?

The admin enters:

    Email
    Password

For example:

    email: admin@gmail.com
    password: 123456

The request reaches:

    loginAdmin()

# 3. Where is the JWT token created?

The JWT token is created RIGHT HERE:

    const token = jwt.sign(
        email + password,
        process.env.JWT_SECRET
    );

This is the exact line where your server creates the token.

`jwt.sign()` means:

    "Create a signed JWT using this payload and this secret."


# 4. What is the payload?

In your code:

    email + password

is being used as the payload.

So conceptually:

    jwt.sign(PAYLOAD, SECRET)

Your code is:

    jwt.sign(email + password, process.env.JWT_SECRET)


The payload is the information that is put inside the JWT.

IMPORTANT:

A JWT is **signed, not encrypted**.

Therefore, sensitive information such as the actual password should NOT normally be placed inside the JWT payload.

A better approach would be something like:

    const token = jwt.sign(
        { email: email },
        process.env.JWT_SECRET
    );

Or, even better, use a stable admin/user ID:

    const token = jwt.sign(
        { id: admin._id },
        process.env.JWT_SECRET
    );

For learning your current code, however, remember:

    jwt.sign()
         ↓
    Creates JWT
         ↓
    Returns token


# 5. What is `JWT_SECRET`?

This:

    process.env.JWT_SECRET

is a secret value stored in your `.env` file.

For example:

    JWT_SECRET=someVerySecretValue


The server uses this secret to SIGN the JWT.

Later, your authentication middleware uses the same secret to VERIFY the JWT.

Conceptually:

    LOGIN

    email + password
          ↓
       jwt.sign()
          ↓
    JWT_SECRET
          ↓
       JWT Token


Later:

    PROTECTED REQUEST

       JWT Token
          ↓
       jwt.verify()
          ↓
    JWT_SECRET
          ↓
    Valid or Invalid?


So the secret is what allows your server to determine whether the token has a valid signature.


# 6. What happens after the token is created?

Your code does:

    res.status(200).json({
        success: true,
        token
    });

This means the server sends the token back to the client in the HTTP response.

The response is conceptually:

    {
        success: true,
        token: "eyJhbGciOiJIUzI1NiIs..."
    }

# 7. So where did the cookie come from?

This is an important distinction:

    JWT ≠ Cookie

They are two completely different things.

JWT is a **token format**.

Cookie is a **browser storage/transport mechanism**.


Think of it like this:

    JWT
    ↓
    The actual authentication token

    Cookie
    ↓
    A place/mechanism through which the browser can store
    and automatically send information


You can use JWT without cookies.

You can also use cookies without JWT.

But they are often used together.


# 8. JWT and Cookie are NOT the same thing

Suppose your JWT is:

    eyJhbGciOiJIUzI1NiIs...


That string is the JWT.

A cookie could store that JWT like:

    token = eyJhbGciOiJIUzI1NiIs...


So:

    Cookie
    └── token
        └── JWT


The cookie is the container/storage mechanism.

The JWT is the authentication credential.


# 9. Nothing

# 10. What exactly is a cookie?

A cookie is a small piece of data that a website asks the browser to store.

For example:

    token = eyJhbGciOiJIUzI1NiIs...


The browser stores this cookie for that website.

Later, when the browser makes another request to that website, the browser can automatically send the cookie with the request, depending on the cookie settings.


Conceptually:

    Server
      ↓
    "Store this cookie"
      ↓
    Browser
      ↓
    Cookie stored


Later:

    Browser
      ↓
    Request + Cookie
      ↓
    Server


# 11. Where is the token actually stored?

This depends on how you choose to store it.

There are multiple possibilities.

### Method 1 — Return JWT in JSON

Your current code does this:

    res.status(200).json({
        success: true,
        token
    });

The frontend receives the token.

The frontend then decides what to do with it.

For example, it could keep it in memory or store it somewhere such as localStorage.

### Method 2 — Store JWT inside a Cookie

The server can send:

    res.cookie("token", token, {
        httpOnly: true
    });

Then the browser stores the cookie.

So the important concept is:

    JWT is created by SERVER.

    JWT can be returned to CLIENT.

    CLIENT/BROWSER can store it.

    JWT can then be sent back with future requests.


# 12. If the JWT is in a cookie, where is it?

It is stored by the browser as a cookie associated with the website.

It is not stored inside your Node.js server's memory as the user's authentication token.

Conceptually:

    SERVER
       |
       | creates JWT
       ↓
    CLIENT
       |
       ↓
    BROWSER
       |
       ↓
    Cookie
       |
       ↓
    JWT


# 13. What happens when admin wants to add a doctor?

Suppose the admin has successfully logged in.

Now the admin wants:

    POST /api/admin/add-doctor

This is a protected API.

Why?

Because we don't want:

    Anyone
       ↓
    /add-doctor
       ↓
    Create a doctor


We want:

    Authenticated Admin
          ↓
    /add-doctor
          ↓
    Create doctor


This is where middleware becomes important.


# 14. Why do we need `authAdmin` middleware?

This is one of the most important concepts.

You said:

    "Only the admin can click Add Doctor, so why do we need
     token verification?"

Because the server cannot trust the frontend.

Suppose your frontend has:

    Add Doctor button

You might think:

    "Only the admin sees this button."

But a user does NOT need to use your frontend.

Someone can directly send:

    POST /api/admin/add-doctor

using Postman, curl, another application, or their own HTTP request.

The server must therefore protect the API itself.

The server cannot simply say:

    "The frontend has an Add Doctor button only for admins,
     so the request must be from an admin."

That is NOT security.


# 15. Frontend restrictions are NOT authentication

For example, hiding the button:

    if (isAdmin) {
        show Add Doctor button
    }

is only a UI restriction.

It does NOT protect your backend.

Someone can bypass the frontend completely.

Therefore:

    Frontend
    ↓
    User interface restriction

    Backend Middleware
    ↓
    REAL API protection


This is why `authAdmin` is necessary.


# 16. What does `authAdmin` actually do?

The middleware receives the incoming request BEFORE the protected controller.

For example:

    adminRouter.post(
        "/add-doctor",
        authAdmin,
        upload.single("image"),
        addDoctor
    );


The request flow becomes:

    POST /api/admin/add-doctor
                ↓
            authAdmin
                ↓
          Verify JWT
                ↓
          Is token valid?
             /      \
           YES      NO
            ↓        ↓
       addDoctor    401


So `authAdmin` acts like a security checkpoint.


# 17. Why can't we just verify the token inside `addDoctor()`?

Technically, you could.

But it would be bad architecture.

Imagine you have:

    /add-doctor
    /remove-doctor
    /update-doctor
    /get-doctors
    /get-appointments
    /cancel-appointment

If every controller contains:

    Get token
    Verify token
    Check admin
    Continue

then you repeat the same authentication code everywhere.

Instead:

    authAdmin
        ↓
    Central authentication check


Then every protected route can reuse it:

    adminRouter.post("/add-doctor", authAdmin, addDoctor);

    adminRouter.post("/remove-doctor", authAdmin, removeDoctor);

    adminRouter.get("/doctors", authAdmin, getDoctors);


This is exactly why middleware is useful.


# 18. What does the middleware verify?

The middleware receives the JWT from the request.

Then it uses:

    jwt.verify()

For example:

    const token = req.headers.authorization?.split(" ")[1];

    const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
    );


Conceptually:

    Request
       ↓
    JWT Token
       ↓
    jwt.verify()
       ↓
    JWT_SECRET
       ↓
    Valid?
      /   \
    YES    NO
     ↓      ↓
  Continue  401


If the token is invalid, the middleware stops the request.

The controller is never reached.


# 19. Why is `401 Unauthorized` used?

If the token is:

    undefined

or:

    missing

or:

    invalid

or:

    expired

then the request does not have valid authentication credentials.

Therefore:

    401 Unauthorized


Example:

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }


Important:

    401
    ↓
    Authentication problem

    403
    ↓
    User is authenticated but does not have permission


# 20. Where does the token go in the request?

There are two common approaches.

### Authorization Header

The client sends:

    Authorization: Bearer <JWT>


The server can read:

    req.headers.authorization


Then extract the token:

    const token = req.headers.authorization.split(" ")[1];


The format is:

    Authorization
          :
       Bearer
          +
        TOKEN


### Cookie

If the JWT is stored in a cookie:

    token=<JWT>


the browser can send that cookie with future requests.

The server can read it using cookie-parsing middleware, such as `cookie-parser`:

    req.cookies.token


So:

    Header approach:

    req.headers.authorization


    Cookie approach:

    req.cookies.token


# 21. Why is the token usually placed in the Authorization header?

Because the header is specifically designed to carry request metadata such as authentication information.

The standard format is:

    Authorization: Bearer <token>


The request body is generally used for the actual data being submitted.

For example:

    POST /api/admin/add-doctor

    Body:

    {
        name: "Dr. Rahul",
        email: "rahul@gmail.com",
        fees: 500
    }


Authentication information can separately be:

    Authorization: Bearer <JWT>


So the request contains:

    Headers
       ↓
    Authentication information

    Body
       ↓
    Application data


# 22. Why not put the JWT inside `req.body`?

You technically CAN send a token in the body.

But it is not the standard approach for authentication.

Also, some requests such as GET requests normally do not use a request body.

For example:

    GET /api/admin/doctors


We still need authentication.

So we can do:

    GET /api/admin/doctors

    Authorization: Bearer <JWT>


This keeps authentication independent from the actual API data.


# 23. Complete flow of your Admin Authentication

Now connect EVERYTHING together.

### STEP 1 — Admin Login

Admin sends:

    POST /api/admin/login

    {
        email,
        password
    }


### STEP 2 — `loginAdmin` controller

Your controller checks:

    email == process.env.ADMIN_EMAIL

    password == process.env.ADMIN_PASSWORD


If correct:

    const token = jwt.sign(
        email + password,
        process.env.JWT_SECRET
    );


JWT is created.


### STEP 3 — Server sends JWT to client

Your current code sends:

    res.status(200).json({
        success: true,
        token
    });


So the client receives the JWT.

IMPORTANT:

    Your current code does NOT create a cookie.


### STEP 4 — Client stores the JWT

The frontend can store/use the token.

Or your backend can instead send it as an HTTP-only cookie:

    res.cookie("token", token, {
        httpOnly: true
    });


Then the browser stores the cookie.


### STEP 5 — Admin makes another request

For example:

    POST /api/admin/add-doctor


The request needs to prove:

    "I am authenticated."


The JWT is sent either:

    Authorization: Bearer <JWT>

or through:

    Cookie: token=<JWT>


depending on your chosen authentication design.


### STEP 6 — `authAdmin` middleware runs

The middleware extracts the token.

Then:

    jwt.verify(token, process.env.JWT_SECRET)


### STEP 7 — Token verification

If valid:

    authAdmin
       ↓
    next()
       ↓
    addDoctor()


If invalid/missing:

    authAdmin
       ↓
    401 Unauthorized


The request stops there.


# 24. The complete architecture

The entire system can now be visualized as:

    ┌──────────────────────┐
    │        ADMIN         │
    │ Email + Password     │
    └──────────┬───────────┘
               ↓
        POST /login
               ↓
    ┌──────────────────────┐
    │   loginAdmin()       │
    │     CONTROLLER       │
    └──────────┬───────────┘
               ↓
        Verify credentials
               ↓
          jwt.sign()
               ↓
          JWT created
               ↓
        Send JWT to client
               ↓
    ┌──────────────────────┐
    │       BROWSER        │
    │                      │
    │ JWT / Cookie         │
    └──────────┬───────────┘
               ↓
       POST /add-doctor
               ↓
    ┌──────────────────────┐
    │      authAdmin       │
    │     MIDDLEWARE       │
    └──────────┬───────────┘
               ↓
        Extract JWT
               ↓
       jwt.verify()
               ↓
       ┌───────┴───────┐
       ↓               ↓
     VALID           INVALID
       ↓               ↓
    next()            401
       ↓
    addDoctor()
       ↓
    Doctor created


# 25. Most important distinction

Remember these four things separately:

    PASSWORD
    ↓
    Proves identity during LOGIN


    JWT
    ↓
    Authentication credential created after successful LOGIN


    COOKIE
    ↓
    Browser mechanism that can store/send the JWT


    AUTHADMIN MIDDLEWARE
    ↓
    Verifies the JWT before protected admin APIs are executed


So:

    Password ≠ JWT

    JWT ≠ Cookie

    Cookie ≠ Middleware

They are different parts of the authentication system.


# ⭐ Final Mental Model

Think of a real building.

    Password
    ↓
    Your identity proof at the entrance


    JWT
    ↓
    Your temporary access pass


    Cookie / Authorization Header
    ↓
    How you carry/send the access pass


    authAdmin Middleware
    ↓
    Security guard checking the access pass


    Protected Controller
    ↓
    The actual room/action you are allowed to use


Therefore:

    LOGIN
      ↓
    Verify Email + Password
      ↓
    Create JWT using jwt.sign()
      ↓
    Give JWT to Client
      ↓
    Client stores/sends JWT
      ↓
    Request reaches authAdmin
      ↓
    authAdmin verifies JWT using jwt.verify()
      ↓
    Valid → next()
      ↓
    Protected controller runs

This is the fundamental idea behind JWT-based authentication.
---