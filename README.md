# Curiosity Journal

## Running the Program

To run the program and reproduce results similar to those shown in the video demo, follow these steps:

1. Clone the repository:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Start the development server:
    ```bash
    npm run dev
    ```

4. Open your browser and navigate to `http://localhost:8888` to see the application in action.

## AI API Calls

The location in the code where AI API calls are made can be found in the following files:
- `src/api/generate/+server.ts`

## Dependencies

This project relies on the following dependencies:
- `svelte` (for UI)
- `axios` (for downloading images from OpenAI API image generation)
- `dotenv` (for managing environment variables)
- `openai` (for AI functionalities)
- `canvas` (for basic image processing in Node.js)