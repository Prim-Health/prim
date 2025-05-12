# Medical Assistant AI Sandbox

An admin portal interface for monitoring and interacting with a medical assistant AI agent. This MVP is a sandbox demo with no persistent login and all data is wiped on each new session.

## Features

- Fake login page with hardcoded credentials
- Session reset on browser refresh or logout
- Overview dashboard with:
  - Care Plan Update Requests
  - Requires Action items
  - Activity Log
- Patient management
- Analytics dashboard (placeholder)

## Tech Stack

- Frontend:
  - ReactJS
  - Next.js
  - Zustand (client state)
  - Tailwind CSS
  - Shadcn UI
- Backend:
  - Firebase Hosting
  - Firestore
  - Firebase Cloud Functions
  - Google Cloud Pub/Sub
  - Python FastAPI for agent backend
  - OpenAI API for care plan diff reasoning and action planning

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

- The project uses Next.js 13+ with the App Router
- State management is handled by Zustand
- UI components are built with Tailwind CSS and Shadcn UI
- Firebase is used for backend services
- The agent backend is implemented in Python with FastAPI

## Data Model

The application uses Firestore with the following collections:

- `user_sessions`: Stores temporary session data
  - `patients`: Patient records
    - `timeline`: Medical events
    - `care_plan_snapshots`: Care plan versions
    - `actions`: Agent actions

## Mock Data

- On user login, create a new **session document** in Firestore.
- Under that session, create a **`patients` subcollection** with **7 mock patients**:
    - Vary names, conditions, compliance risk, and Medicare codes.
- For each patient:
    - Add a **`timeline` subcollection** with a unique timeline of events (as documents).
    - Add a **`care_plan_snapshots` subcollection** with **2–7 versions** of past care plans.
    - Add an **`actions` subcollection** with **at least 8 actions** per patient:
        - All actions should have **many `activity_logs`** documenting what happened.
        - All actions should be in state `successful`, **except 4 total** (across all patients) marked `failed`.
- For **only one patient**:
    - Mark their most recent care plan as **requiring review**.
    - Add **2–5 flags** (reasons for review).
    - Add **3–5 suggestions**:
        - Suggestions appear in the care plan review modal.
        - Each can be accepted/rejected, and updates the care plan accordingly.
        - Flags and suggestions appear on the **top-right of the modal**, with the care plan in the main view.
- All data should be **hardcoded** and automatically **loaded/populated on login**.


## License

MIT
