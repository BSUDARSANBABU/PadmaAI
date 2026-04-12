# Backend Generation (Back_Gen)

This folder contains a generated backend structure based on the frontend's data models and requirements.

## Structure

- `models.ts`: Defines the data interfaces and mock database state for Reminders, Chat History, and Voice Profiles.
- `views.ts`: Contains the business logic (controllers) for handling API requests.
- `urls.ts`: Defines the API routes (URLs) and maps them to the corresponding views.
- `server.ts`: The main entry point for the Express server.

## API Endpoints

### Reminders
- `GET /api/reminders`: List all reminders.
- `POST /api/reminders`: Create a new reminder.
- `PUT /api/reminders/:id`: Update an existing reminder.
- `DELETE /api/reminders/:id`: Delete a reminder.

### Chat History
- `GET /api/chat-history`: Retrieve the conversation log.
- `POST /api/chat-history`: Add a new message to the log.

### Voice Profiles
- `GET /api/voice-profiles`: List all available voice profiles.
- `PUT /api/voice-profiles/:id/select`: Select a specific voice profile.
