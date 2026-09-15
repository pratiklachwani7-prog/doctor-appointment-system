# 🩺 Doctor Appointment System — APIs

## 👨‍💼 Admin APIs

### `POST /api/admin/add-doctor`

Adds a new doctor to the system along with their profile information and profile image.

### `POST /api/admin/login`

Authenticates an admin using their login credentials.

### `POST /api/admin/all-doctors`

Fetches all doctors from the system without including their passwords.

### `GET /api/doctor/list`

Fetches all doctors from the system without their password and email. The frontend calls this API to automatically retrieve the doctors' data and display the doctors on the home page of the website.

---
# 🩺 Admin API vs Doctor List API

## Admin API

    GET /api/admin/all-doctors

Used by the **admin panel** to fetch doctors for management.

- Admin only
- Can return more doctor information
- Protected by admin authentication


## Doctor List API

    GET /api/doctor/list

Used by the **frontend website** to fetch doctors and display them on the home page.

- Public/user-facing
- Should return only safe doctor information
- Password and email are excluded


## ⭐ Main Difference

    /api/admin/all-doctors
        → Admin uses it to MANAGE doctors

    /api/doctor/list
        → Frontend uses it to DISPLAY doctors

Both may fetch the same doctors from MongoDB, but their **purpose, access, and returned data are different**.
---

### 'POST /api/user/login'
Authenticates a user using their email and password and returns a JWT token.


### 'GET /api/user/get-profile'
Fetches the profile information of the logged-in user.

### POST `/api/user/update-profile`

Updates the profile information of the logged-in user and optionally updates their profile image.