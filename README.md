# BackTube - Backend for YouTube-inspired Platform

## Database Schema / Data Model

![Data Model](src/data-model/data-model.png)

## API Testing

### Postman Collection
You can test the API endpoints using our Postman collection:

**[BackTube API Collection](https://shoryasethia.postman.co/workspace/Shorya-Sethia's-Workspace~2988e049-8a94-4224-8f3b-baf9295c8093/collection/45179578-ef61529f-1127-4054-95bd-6102984a03d8?action=share&creator=45179578&active-environment=45179578-1756074b-0697-45b4-acd1-03fd72d67ace)**

#### Environment Setup
The collection uses an environment variable:
- **Variable Name**: `server`
- **Value**: `http://localhost:8000/api/v1`

Make sure to set this environment variable in your Postman environment before testing the endpoints.

The collection includes:
- **User Registration** - Complete user registration with avatar and cover image upload
- **User Authentication** - Login and token management
- **File Upload** - Image upload functionality with Cloudinary integration

### Available Endpoints

#### User Management
- `POST /api/v1/users/register` - Register a new user with avatar and optional cover image
- More endpoints coming soon...