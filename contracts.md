# Spotters CXJ - API Contracts

## Auth Endpoints

### POST /api/auth/session
- Request: `{ "session_id": "string" }`
- Response: `{ "user_id", "email", "name", "picture", "role", "approved" }`
- Sets httpOnly cookie with session_token

### GET /api/auth/me
- Auth: Cookie session_token or Bearer token
- Response: User object or 401

### POST /api/auth/logout
- Clears session from DB and cookie

---

## User Management (Admin Only)

### GET /api/admin/users
- Returns all users with roles

### PUT /api/admin/users/{user_id}/role
- Body: `{ "role": "admin_authorized" | "contributor" }`
- Only admin_principal can change roles

### PUT /api/admin/users/{user_id}/approve
- Body: `{ "approved": true/false }`

### DELETE /api/admin/users/{user_id}
- Remove user (not admin_principal)

---

## Page Content Management

### GET /api/pages/{page_slug}
- Public endpoint
- Returns page content (home, airport-history, spotters-history, memories)

### PUT /api/pages/{page_slug}
- Auth: Admin only
- airport-history: Only admin_principal
- Body: `{ "title", "subtitle", "content", "sections": [] }`

---

## Site Settings

### GET /api/settings
- Public endpoint
- Returns: `{ "google_form_link", "instagram", "youtube", "footer_content" }`

### PUT /api/settings
- Auth: Admin only
- Update site-wide settings

---

## Leaders Management

### GET /api/leaders
- Public endpoint
- Returns list of leaders

### POST /api/leaders
- Auth: Admin only
- Body: `{ "name", "role", "instagram", "photo_url", "order" }`

### PUT /api/leaders/{leader_id}
- Auth: Admin only

### DELETE /api/leaders/{leader_id}
- Auth: Admin only

---

## Gallery

### GET /api/gallery
- Public endpoint
- Query params: `?aircraft_type=&prefix=&author=`
- Returns photos with metadata

### POST /api/gallery
- Auth: Approved user (contributor or admin)
- Body: FormData with image + metadata
- Required: description, aircraft_model, aircraft_type, date, author
- Limit: 5 photos per author per prefix

### DELETE /api/gallery/{photo_id}
- Auth: Admin or photo author

### Aircraft Types (Filter)
- Airbus
- Boeing  
- Embraer
- ATR
- Aviação Geral

---

## Memories (Recordacoes)

### GET /api/memories
- Public endpoint

### POST /api/memories
- Auth: Admin only
- Body: `{ "title", "content", "image_url", "layout", "order" }`

### PUT /api/memories/{memory_id}
### DELETE /api/memories/{memory_id}

---

## File Upload

### POST /api/upload
- Auth: Approved user
- Body: FormData with file
- Returns: `{ "url": "string" }`

---

## Models

### User
```python
{
  "user_id": str,
  "email": str,
  "name": str,
  "picture": str,
  "role": "admin_principal" | "admin_authorized" | "contributor",
  "approved": bool,
  "created_at": datetime
}
```

### Photo
```python
{
  "photo_id": str,
  "url": str,
  "description": str,  # Required
  "aircraft_model": str,  # Required (ex: Boeing 737-800)
  "aircraft_type": str,  # Required (Airbus, Boeing, etc)
  "registration": str,  # Prefix (ex: PR-GXJ)
  "airline": str,
  "date": date,  # Required
  "author_id": str,
  "author_name": str,  # Required
  "approved": bool,
  "created_at": datetime
}
```

### Leader
```python
{
  "leader_id": str,
  "name": str,
  "role": str,  # Cargo
  "instagram": str,  # @handle
  "photo_url": str,
  "order": int
}
```

### Page
```python
{
  "slug": str,  # home, airport-history, spotters-history, memories
  "title": str,
  "subtitle": str,
  "content": str,  # Rich text/markdown
  "sections": [{
    "type": "text" | "image" | "text-image",
    "content": str,
    "image_url": str,
    "layout": "left" | "right"
  }]
}
```

### Settings
```python
{
  "google_form_link": str,
  "instagram_url": str,
  "instagram_handle": str,
  "youtube_url": str,
  "youtube_name": str,
  "footer": {
    "about_text": str,
    "links": [{ "label": str, "url": str }]
  }
}
```
