# BackTube - Backend for YouTube-inspired Platform

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- Cloudinary account for image/video uploads

### Installation
```bash
# Clone the repository
git clone https://github.com/shoryasethia/backtube.git
cd backtube
```
# Install dependencies
```
npm install
```
### Environment Variables
Create a `.env` file in the root directory and add your environment variables. 

You can use the `.env.example` file as a template:
```bash
cp .env.example .env
```

Then update the values in `.env` with your actual credentials:
- MongoDB connection string
- JWT secrets (generate secure random strings)
- Cloudinary credentials for image uploads

### Starting the Development Server
```bash
# Start development server with auto-reload
npm run dev

# Or start production server
npm start
```

The server will start on `http://localhost:8000`

## Authentication Flow Diagram

```mermaid
flowchart TD
    A[User Starts] --> B{Action?}
    
    %% Registration Flow
    B -->|Register| C[POST /api/v1/users/register]
    C --> D[Validate Required Fields]
    D --> E{Valid Data?}
    E -->|No| F[Return 400 Error]
    E -->|Yes| G[Check User Exists]
    G --> H{User Exists?}
    H -->|Yes| I[Return 409 Conflict]
    H -->|No| J[Upload Avatar to Cloudinary]
    J --> K{Avatar Upload Success?}
    K -->|No| L[Return 400 Error]
    K -->|Yes| M[Create User in DB]
    M --> N[Return User Data<br/>No Tokens Yet]
    
    %% Login Flow
    B -->|Login| O[POST /api/v1/users/login]
    O --> P[Extract username/email + password]
    P --> Q{Required Fields Present?}
    Q -->|No| R[Return 400 Error]
    Q -->|Yes| S[Find User in DB]
    S --> T{User Found?}
    T -->|No| U[Return 404 Error]
    T -->|Yes| V[Verify Password]
    V --> W{Password Valid?}
    W -->|No| X[Return 401 Error]
    W -->|Yes| Y[Generate Access Token<br/>expires: 1d]
    Y --> Z[Generate Refresh Token<br/>expires: 10d]
    Z --> AA[Save Refresh Token to DB]
    AA --> BB[Set HTTP-Only Cookies<br/>accessToken + refreshToken]
    BB --> CC[Return Success Response<br/>+ User Data + Tokens]
    
    %% Protected Route Access
    B -->|Access Protected Route| DD[Any Protected Endpoint]
    DD --> EE[Auth Middleware: verifyJWT]
    EE --> FF{Access Token in Cookie?}
    FF -->|No| GG{Token in Authorization Header?}
    GG -->|No| HH[Return 401 Unauthorized]
    GG -->|Yes| II[Extract Bearer Token]
    FF -->|Yes| JJ[Extract Cookie Token]
    II --> KK[Verify JWT Signature]
    JJ --> KK
    KK --> LL{Token Valid & Not Expired?}
    LL -->|No| MM[Return 401 Invalid Token]
    LL -->|Yes| NN[Decode User ID from Token]
    NN --> OO[Find User in DB]
    OO --> PP{User Found?}
    PP -->|No| QQ[Return 401 Invalid Token]
    PP -->|Yes| RR[Add User to req.user]
    RR --> SS[Continue to Protected Route]
    
    %% Logout Flow
    B -->|Logout| TT[POST /api/v1/users/logout]
    TT --> UU[Auth Middleware: verifyJWT]
    UU --> VV{Authentication Success?}
    VV -->|No| WW[Return 401 Unauthorized]
    VV -->|Yes| XX[Remove Refresh Token from DB<br/>$unset: refreshToken]
    XX --> YY[Clear accessToken Cookie]
    YY --> ZZ[Clear refreshToken Cookie]
    ZZ --> AAA[Return Success Response]
    
    %% Token Expiry Scenarios
    KK --> BBB{Token Expired?}
    BBB -->|Yes| CCC[JWT Library Throws<br/>TokenExpiredError]
    CCC --> DDD[Return 401 jwt expired]
    BBB -->|No| LL
    
    %% Styling
    classDef errorBox fill:#ffebee,stroke:#f44336,color:#000
    classDef successBox fill:#e8f5e8,stroke:#4caf50,color:#000
    classDef processBox fill:#e3f2fd,stroke:#2196f3,color:#000
    classDef decisionBox fill:#fff3e0,stroke:#ff9800,color:#000
    
    class F,I,L,R,U,X,HH,MM,QQ,WW,DDD errorBox
    class N,CC,SS,AAA successBox
    class C,D,G,J,M,O,P,S,V,Y,Z,AA,BB,DD,EE,II,JJ,KK,NN,OO,RR,TT,UU,XX,YY,ZZ processBox
    class B,E,H,K,Q,T,W,FF,GG,LL,PP,VV,BBB decisionBox
```

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


### Available Endpoints

#### User Management
- `POST /api/v1/users/register` - Register a new user with avatar and optional cover image
- `POST /api/v1/users/login` - User login with username/email and password
- `POST /api/v1/users/logout` - User logout (requires authentication)
