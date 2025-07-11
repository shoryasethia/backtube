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
- Cloudinary credentials for image/video uploads

### Starting the Development Server
```bash
# Start development server with auto-reload
npm run dev

# Or start production server
npm start
```

The server will start on `http://localhost:8000`

## Flow Diagrams

<details>
<summary>Authentication</summary>

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

</details>

<details>
<summary>Refresh Access Token</summary>

```mermaid
flowchart TD
    A[Client Request] --> B[POST /api/v1/users/refresh-token]
    B --> C[Extract Refresh Token]
    C --> D{Token Source?}
    
    %% Token extraction
    D -->|From Cookie| E[req.cookies.refreshToken]
    D -->|From Body| F[req.body.refreshToken]
    E --> G[incomingRefreshToken]
    F --> G
    
    %% Validation
    G --> H{Token Present?}
    H -->|No| I[Return 401<br/>Unauthorized request]
    H -->|Yes| J[Verify JWT Signature]
    
    %% JWT Verification
    J --> K{Valid JWT?}
    K -->|No| L[JWT Error<br/>Invalid/Malformed]
    K -->|Yes| M[Decode Token Payload]
    
    %% User Validation
    M --> N[Extract User ID<br/>from decoded token]
    N --> O[Find User in Database<br/>User.findById]
    O --> P{User Exists?}
    P -->|No| Q[Return 401<br/>Invalid Refresh token]
    P -->|Yes| R[Compare Tokens]
    
    %% Token Comparison
    R --> S{incomingRefreshToken === user.refreshToken?}
    S -->|No| T[Return 401<br/>Token expired or used]
    S -->|Yes| U[Generate New Tokens]
    
    %% Token Generation
    U --> V[generateAccessAndRefreshTokens<br/>user._id]
    V --> W[Create New Access Token<br/>expires: 1d]
    W --> X[Create New Refresh Token<br/>expires: 10d]
    X --> Y[Save New Refresh Token<br/>to Database]
    
    %% Response
    Y --> Z[Set Cookie Options<br/>httpOnly: true, secure: true]
    Z --> AA[Set accessToken Cookie]
    AA --> BB[Set refreshToken Cookie]
    BB --> CC[Return Response<br/>200 + New Tokens]
    
    %% Error Handling
    J --> DD{JWT Error Type?}
    DD -->|TokenExpiredError| EE[Return 401<br/>jwt expired]
    DD -->|JsonWebTokenError| FF[Return 401<br/>Invalid token]
    DD -->|Other Error| GG[Return 401<br/>Error message]
    
    L --> HH[Return 401<br/>Invalid refresh token]
    EE --> HH
    FF --> HH
    GG --> HH
    
    %% Styling
    classDef errorBox fill:#ffebee,stroke:#f44336,color:#000
    classDef successBox fill:#e8f5e8,stroke:#4caf50,color:#000
    classDef processBox fill:#e3f2fd,stroke:#2196f3,color:#000
    classDef decisionBox fill:#fff3e0,stroke:#ff9800,color:#000
    classDef tokenBox fill:#f3e5f5,stroke:#9c27b0,color:#000
    
    class I,Q,T,EE,FF,GG,HH,L errorBox
    class CC successBox
    class B,C,E,F,G,J,M,N,O,R,U,V,W,X,Y,Z,AA,BB processBox
    class D,H,K,P,S,DD decisionBox
    class incomingRefreshToken,accessToken,refreshToken tokenBox
```

</details>

<details>
<summary>User Profile Updates</summary>

```mermaid
flowchart TD
    A[User Profile Update Request] --> B{Update Type?}
    
    %% Change Password Flow
    B -->|Change Password| C[POST /api/v1/users/change-password]
    C --> D[Auth Middleware: verifyJWT]
    D --> E{Authenticated?}
    E -->|No| F[Return 401 Unauthorized]
    E -->|Yes| G[Extract Form Data<br/>upload.none middleware]
    G --> H[Get oldPassword, newPassword,<br/>confirmNewPassword from req.body]
    H --> I{newPassword === confirmNewPassword?}
    I -->|No| J[Return 400<br/>Passwords do not match]
    I -->|Yes| K[Find User in DB<br/>req.user._id]
    K --> L[Verify Old Password<br/>user.isPasswordCorrect]
    L --> M{Old Password Valid?}
    M -->|No| N[Return 400<br/>Invalid old password]
    M -->|Yes| O[Update Password<br/>user.password = newPassword]
    O --> P[Save User<br/>validateBeforeSave: false]
    P --> Q[Return 200<br/>Password updated successfully]
    
    %% Get Current User Flow
    B -->|Get Current User| R[GET /api/v1/users/current-user]
    R --> S[Auth Middleware: verifyJWT]
    S --> T{Authenticated?}
    T -->|No| U[Return 401 Unauthorized]
    T -->|Yes| V{req.user exists?}
    V -->|No| W[Return 401<br/>User not found]
    V -->|Yes| X[Return 200<br/>Current user data]
    
    %% Update Avatar Flow
    B -->|Update Avatar| Y[POST /api/v1/users/change-avatar]
    Y --> Z[Auth Middleware: verifyJWT]
    Z --> AA{Authenticated?}
    AA -->|No| BB[Return 401 Unauthorized]
    AA -->|Yes| CC[Single Upload Middleware<br/>uploadSingleAvatar]
    CC --> DD[Get File Path<br/>req.file.path]
    DD --> EE{Avatar File Present?}
    EE -->|No| FF[Return 400<br/>Avatar file missing]
    EE -->|Yes| GG[Upload to Cloudinary<br/>uploadOnCloudinary]
    GG --> HH{Upload Success?}
    HH -->|No| II[Return 400<br/>Upload failed]
    HH -->|Yes| JJ[Get Current User<br/>& Old Avatar URL]
    JJ --> KK[Update User Avatar<br/>in Database]
    KK --> LL{Old Avatar URL exists?}
    LL -->|No| MM[Return Success Response<br/>deletionStatus: null]
    LL -->|Yes| NN[Try Delete Old Avatar<br/>deleteFromCloudinary]
    NN --> OO{Deletion Success?}
    OO -->|Yes| PP[Return Success Response<br/>deletionStatus: success]
    OO -->|No| QQ[Return Success Response<br/>deletionStatus: error message]
    
    %% Update Cover Image Flow
    B -->|Update Cover Image| RR[POST /api/v1/users/change-cover-image]
    RR --> SS[Auth Middleware: verifyJWT]
    SS --> TT{Authenticated?}
    TT -->|No| UU[Return 401 Unauthorized]
    TT -->|Yes| VV[Single Upload Middleware<br/>uploadSingleCoverImage]
    VV --> WW[Get File Path<br/>req.file.path]
    WW --> XX{Cover Image File Present?}
    XX -->|No| YY[Return 400<br/>Cover image file missing]
    XX -->|Yes| ZZ[Upload to Cloudinary<br/>uploadOnCloudinary]
    ZZ --> AAA{Upload Success?}
    AAA -->|No| BBB[Return 400<br/>Upload failed]
    AAA -->|Yes| CCC[Get Current User<br/>& Old Cover Image URL]
    CCC --> DDD[Update User Cover Image<br/>in Database]
    DDD --> EEE{Old Cover Image URL exists?}
    EEE -->|No| FFF[Return Success Response<br/>deletionStatus: null]
    EEE -->|Yes| GGG[Try Delete Old Cover Image<br/>deleteFromCloudinary]
    GGG --> HHH{Deletion Success?}
    HHH -->|Yes| III[Return Success Response<br/>deletionStatus: success]
    HHH -->|No| JJJ[Return Success Response<br/>deletionStatus: error message]
    
    %% Styling
    classDef errorBox fill:#ffebee,stroke:#f44336,color:#000
    classDef successBox fill:#e8f5e8,stroke:#4caf50,color:#000
    classDef processBox fill:#e3f2fd,stroke:#2196f3,color:#000
    classDef decisionBox fill:#fff3e0,stroke:#ff9800,color:#000
    classDef uploadBox fill:#f3e5f5,stroke:#9c27b0,color:#000
    classDef authBox fill:#e1f5fe,stroke:#00acc1,color:#000
    
    class F,J,N,U,W,BB,FF,II,UU,YY,BBB errorBox
    class Q,X,MM,PP,QQ,FFF,III,JJJ successBox
    class C,D,G,H,K,L,O,P,R,S,Y,Z,CC,DD,GG,JJ,KK,RR,SS,VV,WW,ZZ,CCC,DDD processBox
    class B,E,I,M,T,V,AA,EE,HH,LL,NN,OO,TT,XX,AAA,EEE,GGG,HHH decisionBox
    class GG,ZZ,NN,GGG uploadBox
    class D,S,Z,SS authBox
```

</details>

## Database Schema / Data Model

<details>
<summary>Database Schema Diagram</summary>

![Data Model](src/data-model/data-model.png)

</details>

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
- `POST /api/v1/users/refresh-token` - Refresh access token using refresh token
- `GET /api/v1/users/current-user` - Get current authenticated user data (requires authentication)
- `POST /api/v1/users/change-password` - Change user password (requires authentication)
- `POST /api/v1/users/change-avatar` - Update user avatar image (requires authentication)
- `POST /api/v1/users/change-cover-image` - Update user cover image (requires authentication)
- `GET /api/v1/users/channel/:username` - Get user channel profile with subscriber count and subscription status
