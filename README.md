# Architect Knowledge Tracker

A clean, modern personal knowledge-tracking web application designed specifically for software engineers. This tool helps you map out and connect your professional learning journey.

## 🎯 Purpose

As a software engineer, learning isn't just about reading a book; it's about understanding concepts and applying them through projects. This tracker allows you to:
- **Track Industry Books:** Keep tabs on what you're reading, your progress (%), and your notes.
- **Map Architecture Concepts:** Define patterns, system design principles, and concepts.
- **Track Projects:** Log the practical implementations where you've applied these concepts.
- **Connect Everything:** A many-to-many relationship system lets you see exactly which books taught you which concepts, and which projects utilize them.

## 🛠 Tech Stack

Built with modern, high-performance web technologies:
- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/)
- **Database:** SQLite
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication:** [Auth.js v5](https://authjs.dev/) (NextAuth beta)

## ✨ Features

- **Dynamic Dashboard:** A comprehensive overview of your learning progress, including metrics on concepts mastered and books finished.
- **Deep Relationships:** Link multiple concepts to a single book, or multiple concepts to a specific project.
- **Secure Management:** A protected `/manage` portal that requires authentication to add or edit data, keeping your knowledge graph safe.
- **Authentication:** Supports both Email/Password and Google OAuth sign-in methods.
- **Premium Design:** Dark mode by default, utilizing soft cards, subtle Framer Motion animations, and clean Lucide icons.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm, pnpm, or yarn

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root of the project with the following variables:
```env
# Required for Auth.js (Generate via `npx auth secret` or `openssl rand -base64 33`)
AUTH_SECRET="your_generated_secret_here"

# Optional: Google OAuth Credentials (for Google Sign-in)
AUTH_GOOGLE_ID="your_google_client_id"
AUTH_GOOGLE_SECRET="your_google_client_secret"
```

### 3. Database Setup
Push the Drizzle schema to your local SQLite database:
```bash
npx drizzle-kit push
```

### 4. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. 

## 🔒 Security Note
The SQLite database (`sqlite.db`) is automatically ignored in `.gitignore` to prevent you from accidentally committing your personal notes, passwords, or session data to a public repository. Do not push your database file.

## 📄 License
MIT License
