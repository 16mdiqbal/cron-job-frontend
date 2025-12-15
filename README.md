 # Cron Job Manager – Frontend

> A modern, full-featured web interface for managing scheduled jobs, users, and notifications. Built with React, TypeScript, Vite, Zustand, and Tailwind CSS.

---

## Table of Contents
- [Features](#features)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
- [Core Functionality](#core-functionality)
- [Tech Stack](#tech-stack)
- [Future Development](#future-development)
---

## Features
- **User Authentication**: Secure login with JWT
- **Job Management**: Create, update, delete, and execute cron jobs
- **User Management**: Add, edit, and manage users
- **Notification System**: Real-time notifications with unread/read tracking, dropdown UI, and preferences
- **Dashboard**: Visual overview of jobs, executions, and system status
- **Modern UI/UX**: Gradient backgrounds, glassmorphism, dark mode, and responsive design
- **Settings**: User preferences and notification controls

---

## Folder Structure

```
cron-job-frontend/
├── public/
│   └── cronjob-icon.svg         # Custom favicon
├── src/
│   ├── assets/                  # Static assets (if any)
│   ├── components/              # Reusable UI components
│   │   ├── layout/              # Header, Sidebar, Layout
│   │   ├── notifications/       # Notification dropdown
│   │   ├── users/               # User forms
│   │   └── ...                  # Other UI modules
│   ├── config/                  # App configuration
│   ├── constants/               # Constant values
│   ├── hooks/                   # Custom React hooks
│   ├── pages/                   # Route pages (Dashboard, Jobs, Users, etc.)
│   ├── services/                # API and utility services
│   │   ├── api/                 # API clients (auth, jobs, notifications, etc.)
│   │   ├── storage/             # Local storage helpers
│   │   └── utils/               # Service utilities
│   ├── stores/                  # Zustand state stores
│   ├── types/                   # TypeScript types
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # App entry point
│   └── index.css                # Global styles
├── index.html                   # HTML entry (title, favicon)
├── package.json                 # Project metadata and scripts
└── README.md                    # Project documentation
```

---

## Getting Started

1. **Install dependencies:**
  ```bash
  npm install
  ```
2. **Start development server:**
  ```bash
  npm run dev
  ```
3. **Build for production:**
  ```bash
  npm run build
  ```

---

## Core Functionality

- **Authentication**: Login, JWT storage, protected routes
- **Job Management**: CRUD for jobs, execution trigger, job status
- **User Management**: Add/edit users, reset modal state, autofill off
- **Notifications**: Real-time updates, unread badge, mark all as read, preferences
- **Dashboard**: Overview cards, charts, job/execution stats
- **Settings**: User preferences, notification toggles
- **Modern UI**: Gradients, glassmorphism, animated badges, dark mode, custom favicon

---

## Tech Stack

- **React 19**
- **TypeScript**
- **Vite**
- **Zustand** (state management)
- **Tailwind CSS**
- **Axios** (API calls)
- **date-fns** (date formatting)

---

## Future Development

- **Role-based Access Control**: Fine-grained permissions for users
- **Job History & Logs**: Detailed execution logs and job history
- **Notification Channels**: Email, SMS, or push notifications
- **Advanced Scheduling**: Support for more complex cron patterns
- **Audit Trail**: Track changes and user actions
- **Accessibility Improvements**: Enhanced a11y and keyboard navigation
- **Internationalization (i18n)**: Multi-language support
- **Testing**: Add unit and integration tests

---

## License

MIT

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
