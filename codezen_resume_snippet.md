# 📝 CodeZen Resume & Interview Prep Guide

This document contains polished, impact-driven bullet points for your resume, a summary of the technology stack, and interview preparation points for **CodeZen**.

---

## 📄 Resume Snippet (Standard Format)

**CodeZen | Full-Stack Online Judge & AI Coding Tutor**  
*Technologies: React, Node.js, Express.js, MongoDB, Redis, Google Gemini API, Tailwind CSS, Redux Toolkit, Axios, REST APIs*

*   **Full-Stack Online Judge System:** Architected and deployed an interactive coding platform (similar to LeetCode) allowing users to run, test, and submit code across multiple programming languages (JavaScript, Python, C++, Java).
*   **Dynamic Code Execution Pipeline:** Developed an automated execution pipeline that dynamically wraps candidate submissions with helper drivers, compiles/runs them through sandboxed compiler environments (OneCompiler API), and validates inputs against hidden test suites.
*   **Context-Aware AI Tutor Integration:** Integrated Google Gemini API to build a side-by-side interactive AI Coding Assistant. Engineered custom prompt layouts and system messages to enforce tutoring pedagogy, guiding users using step-by-step logic hints, dry-run checklists, and complexity advice rather than giving copy-pasteable solutions.
*   **Secure Authentication & Session Management:** Implemented JWT-based session security and engineered an efficient log-out token blacklisting mechanism using Redis caches with Time-To-Live (TTL) expiration matching JWT limits.
*   **Interactive Admin & User Portals:** Developed a feature-rich admin dashboard supporting full CRUD operations for problem creation, template configuration, and test-case entry, coupled with a responsive user profile tracking submission histories and completion statistics.
*   **Optimized Developer Workflows:** Optimized development builds using Vite, configured CORS-free API routing using reverse proxy setups, and utilized Redux Toolkit for high-performance frontend state synchronization.

---

## 🛠️ Technology Stack Breakdown

| Layer | Technology | Key Purpose in CodeZen |
| :--- | :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, DaisyUI | Modular, high-performance UI components with rapid rendering and clean, modern themes. |
| **State Management** | Redux Toolkit | Clean global client state management for active user sessions, problem search queries, and sidebar navigation. |
| **Backend API** | Node.js, Express.js | Structured RESTful routes handling users, submission queues, challenge schemas, and AI tutoring workflows. |
| **Database** | MongoDB & Mongoose ODM | Document-based persistence storing problem definitions, visible/hidden test cases, submission logs, and user credentials. |
| **Session Cache** | Redis | High-speed cache for session invalidation (blacklisting JWT tokens immediately upon logout). |
| **AI Layer** | Google Gemini API (`@google/generative-ai`) | Large language model integration running custom prompts for pedagogical tutoring. |
| **Execution** | RapidAPI OneCompiler | Secure remote compiler sandboxing for running C++, Java, JS, and Python solutions. |

---

## 💡 System Design & Rationale (For Interviews)

Be ready to explain these architecture details in your interviews:

### 1. Why use Redis for token blacklisting?
*   **The Problem:** JWT tokens are stateless, meaning once issued, they remain valid until they expire. If a user logs out, their browser deletes the token, but if someone intercepted that token earlier, they could still access the API.
*   **The CodeZen Solution:** We use **Redis** to store the signature of the logged-out tokens. On every protected request, the backend checks Redis. If the token is blacklisted, it blocks the request.
*   **Optimization:** The Redis entries have a TTL (Time-To-Live) set exactly to the token's remaining lifespan, ensuring Redis cleans up expired tokens automatically and uses minimal RAM.

### 2. How does the AI Assistant act as a "Tutor" instead of a "Code Generator"?
*   **Pedagogical Guardrails:** In `aiController.js`, we wrap user history and error contexts (compilation, runtime, or test case failure) in a strict system prompt.
*   **Prompt Engineering:** The assistant is explicitly instructed: *"Do NOT directly output the full, complete copy-paste solution code. Always guide them with hints, concepts, edge cases, and code snippets of small helper blocks only."*
*   **Fallback Resilience:** If the Gemini API key is missing or offline, the backend falls back to a rule-based mock tutor that parses compile logs and outputs debugging checklists.

### 3. How are test cases executed securely?
*   **Code Wrapping:** When a submission is received, CodeZen wraps the user's code in a language-specific runner template (e.g. injects `#include <vector>` and a custom `main` function in C++, or a parser in Python).
*   **Remote Sandboxing:** The fully assembled code is sent in a batch to the OneCompiler run API to protect the local server hosting the backend from running malicious scripts or arbitrary code loops.
*   **Rate Limit Management:** To handle RapidAPI's 1-request-per-second limit, the submission runner implements an asynchronous queue with a `setTimeout` delay of 1.1 seconds between batch executions.

---

## ❓ Frequently Asked Interview Questions

### Q1: How did you handle CORS during development?
> **Answer:** "I bypassed CORS issues by utilizing Vite's proxy feature. In the Vite configuration, I set up a proxy mapping all requests starting with `/api` to `http://localhost:4000`. This made the browser believe the request was going to the same origin, avoiding CORS pre-flight blocks entirely while simplifying environment configurations."

### Q2: What security risks did you consider when running user code?
> **Answer:** "Running user-written code on a server is extremely risky (vulnerable to infinite loops, system file access, and memory leaks). To mitigate this, CodeZen offloads all code execution to a remote sandboxed environment (OneCompiler API) instead of executing it locally on our Express backend. Even if a user attempts to run malicious scripts, the execution environment remains isolated, keeping our primary application server completely safe."

### Q3: Why did you choose MongoDB over a relational database?
> **Answer:** "Coding challenges typically require flexibility in schema structures (e.g., starter codes in multiple languages, varying test case formats, and mixed submission statistics). MongoDB’s document model allowed us to store test cases, starter templates, and code submissions inside single document boundaries without complex table joins, speeding up retrieval times when rendering challenge pages."
