# Goal Description

Implement v1.4.2: **Translation Service Layer & API Integration**

Now that the offline `IndicTransProvider` is stable and frozen, the next objective is to integrate it into the core SmilAI experience so students actually see translated content. We will build a service layer to abstract language mechanics from the API routes.

## Proposed Changes

### 1. `app/language/service.py` (The Translation Service Layer)
We will implement the elegant facade pattern you suggested:
- `translate_for_student(text: str, student_id: str) -> str`
- `translate_from_student(text: str, student_id: str) -> str`

This layer will:
1. Lookup the `student_language` preference from the database using `student_id`.
2. Automatically bypass translation if the student's preferred language is English.
3. Call the `IndicTransProvider` securely, passing the correct source and target language codes.
4. Extract the `.translated_text` from the `TranslationResult` and handle any graceful fallback errors (e.g., returning original English if the provider errors out).

### 2. `app/api/chat.py` (Inbound Translation)
When a student sends a message in Telugu:
- Intercept the incoming `ChatRequest`.
- Pass it through `translate_from_student()`.
- The RAG pipeline and Qwen 2.5 LLM will process the query entirely in English.

### 3. `app/api/chat.py` & `app/assessment/generator.py` (Outbound Translation)
- Translate the generated Quiz Questions before sending them to the frontend.
- Translate the Chat AI responses back to the student's language.

---

## Open Questions

> [!WARNING]
> **The Streaming Translation Dilemma**
> Currently, the Chat API uses `StreamingResponse` to stream English tokens from Ollama to the React frontend one word at a time for "Humanized Latency".
> 
> However, translation models (especially English -> Telugu) cannot translate word-by-word because grammatical structures (Subject-Verb-Object vs Subject-Object-Verb) require the full sentence context to accurately position words.
> 
> **How should we handle this?**
> - **Option A (Sentence Buffering)**: We buffer the English stream until we hit a punctuation mark (`.`, `?`, `!`), translate that sentence chunk via IndicTrans2, and yield the translated sentence to the frontend. (Keeps some streaming feel, but introduces slight "chunked" latency).
> - **Option B (Disable Streaming for Non-English)**: If the student uses Telugu/Hindi, we wait for the entire English response to generate, translate the whole block, and return it at once. (Easier to implement, but loses the streaming UX).
> - **Option C (Pre-Streaming Filler)**: We yield localized filler words (e.g., "ఆలోచిస్తున్నాను..." / "Thinking...") to the frontend to keep the UI alive while we wait for the full response and translation to finish in the background.

> [!IMPORTANT]
> **QA Bugs (Optional Sprint)**
> Should we include the remaining frontend bugs (Learning Progress History updating & Chat Input bindings) in this milestone, or leave them for a dedicated UI cleanup sprint later?

## Verification Plan
- Send a Telugu query via the Chat API; verify it is retrieved and processed in English, and the final response is successfully returned in Telugu.
- Generate an AI Assessment and verify the JSON questions are successfully translated into the target language.
