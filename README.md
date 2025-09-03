# ✈️ Indigo Voice Airlines Agent

A simple AI Voice Agent designed to assist with Indigo Airlines queries, built using the Pipecat framework. This agent uses WebRTC for real-time, peer-to-peer voice communication directly from your browser.

## 🚀 Quick Start (Local Setup)

This guide will get your Indigo Voice Agent running on your local machine, allowing you to interact with it directly from your web browser.

### 1️⃣ Start the Agent Server

The server handles the core AI logic (Speech-to-Text, Language Model, Text-to-Speech) and manages the WebRTC connection.

#### 🔧 Set Up the Environment

1.  **Clone this Repository:**
    If you haven't already, clone this repository to your local machine:
    ```bash
    git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git) # Replace with your actual repo URL
    cd your-repo-name
    ```

2.  **Navigate to the Server Directory:**
    The main server logic (`server.py`, `bot-openai.py`, `requirements.txt`) is located here:
    ```bash
    cd server
    ```
    *(Note: If you structured your repo differently, adjust this path.)*

3.  **Create & Activate a Python Virtual Environment:**
    This isolates your project's dependencies.
    ```bash
    python -m venv venv
    .\venv\Scripts\activate # On Windows
    # On macOS/Linux: source venv/bin/activate
    ```

4.  **Install Python Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    *(This command installs all necessary libraries, including `pipecat-ai[webrtc]` which is essential for the WebRTC transport).*

5.  **Configure API Keys:**
    The agent needs API keys for its AI services (like voice recognition, AI responses, and voice synthesis).
    * Copy the example environment file:
        ```bash
        cp env.example .env
        ```
    * Open the newly created `.env` file in a text editor (e.g., VS Code).
    * **Add your actual API keys** for services such as:
        * `OPENAI_API_KEY` (or `GEMINI_API_KEY` if using a Google Gemini bot)
        * `DEEPGRAM_API_KEY` (for Speech-to-Text)
        * `CARTESIA_API_KEY` (for Text-to-Speech)
        * *(Refer to the `env.example` for all required variables).*

#### ▶️ Run the Server

Once your environment is set up and `.env` is configured, start the server:

```bash
python server.py