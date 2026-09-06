# 🍪 Cookie Parser

## What is `cookie-parser`?

`cookie-parser` is an Express middleware used to **read cookies sent by the browser**.

Install:

    npm install cookie-parser

Import and use it in `server.js`:

    import cookieParser from "cookie-parser";

    app.use(cookieParser());

Now cookies sent by the browser become available in:

    req.cookies

For example, if our login creates:

    res.cookie("token", token);

Then later we can read the JWT using:

    req.cookies.token

### Remember

    res.cookie()       → sends/creates cookie
    cookieParser()     → parses incoming cookies
    req.cookies.token  → gets the token from the cookie

---
# 🔐 Fetching JWT Token — Quick Revision

## 1. From `Authorization` Header

If the request contains:

    Authorization: Bearer <JWT>

We can fetch the JWT using:

    const token = req.headers.authorization?.split(" ")[1];

Flow:

    req.headers.authorization
          ↓
    "Bearer <JWT>"
          ↓
    .split(" ")
          ↓
    ["Bearer", "<JWT>"]
          ↓
    [1]
          ↓
    <JWT>


## 2. From a Custom Header

If we send our own header:

    adminToken: <JWT>

We can fetch it using Express:

    const token = req.header("adminToken");

`req.header()` is a function used to get the value of a specific header.

Example:

    req.header("adminToken")
          ↓
       <JWT>


## 3. From Cookies

If the JWT is stored in a cookie:

    token = <JWT>

First use cookie-parser:

    import cookieParser from "cookie-parser";

    app.use(cookieParser());

Then fetch the JWT:

    const token = req.cookies.token;


## ⭐ Quick Difference

    req.headers
        → Object containing all headers

    req.headers.authorization
        → Gets the Authorization header

    req.header("adminToken")
        → Gets a specific custom header

    req.cookies
        → Object containing parsed cookies

    req.cookies.token
        → Gets the JWT stored in the `token` cookie


## 🔑 Three Common Ways

    Authorization Header:
    Authorization: Bearer <JWT>
    → req.headers.authorization?.split(" ")[1]


    Custom Header:
    adminToken: <JWT>
    → req.header("adminToken")


    Cookie:
    token = <JWT>
    → req.cookies.token
---

