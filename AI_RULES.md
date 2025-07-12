# AI Application Rules and Guidelines

This document outlines the core technologies used in this application and the guidelines for their usage to ensure consistency, maintainability, and best practices.

## Tech Stack Overview

*   **Frontend Framework**: React (with TypeScript)
*   **Build Tool**: Vite
*   **UI Components**: shadcn/ui (built on Radix UI)
*   **Styling**: Tailwind CSS
*   **Routing**: React Router
*   **State Management/Data Fetching**: React Query for server state, React's `useState`/`useContext` for local/global client state.
*   **Icons**: Lucide React
*   **Toasts/Notifications**: Sonner (via `use-toast` hook)
*   **Animations**: Framer Motion
*   **Backend/Authentication/Database**: Supabase (for user management, authentication, and data storage)
*   **Serverless Functions**: Supabase Functions (Deno-based for specific API integrations like video generation)

## Library Usage Rules

To maintain a clean and consistent codebase, please adhere to the following rules when developing:

*   **UI Components**: Always prioritize `shadcn/ui` components for building the user interface. Avoid direct usage of Radix UI primitives unless a specific `shadcn/ui` component is not available and a custom component is absolutely necessary.
*   **Styling**: All styling must be done using **Tailwind CSS** utility classes. Custom CSS files (`.css` or `.scss`) should be avoided, except for global styles defined in `src/index.css`.
*   **Routing**: Use `react-router-dom` for all client-side routing. All main application routes should be defined in `src/App.tsx`.
*   **Data Fetching**: For managing server state and asynchronous data operations, `React Query` is the preferred library.
*   **Icons**: Use icons exclusively from the `lucide-react` library.
*   **Notifications**: Implement all toast notifications using the `sonner` library via the provided `use-toast` hook.
*   **Animations**: For complex animations and transitions, `framer-motion` should be used. Keep animations subtle and purposeful.
*   **File Structure**: Adhere to the established directory structure:
    *   `src/pages/` for top-level views/pages.
    *   `src/components/` for reusable UI components.
    *   `src/hooks/` for custom React hooks.
    *   `src/lib/` for utility functions and helper modules.
    *   `src/contexts/` for React Context providers.
    *   `src/integrations/` for third-party service integrations (e.g., Supabase).
*   **New Components**: Every new component or hook, no matter how small, must be created in its own dedicated file within the `src/components/` or `src/hooks/` directories, respectively. Do not add new components to existing files.
*   **Code Simplicity**: Strive for simple, elegant, and readable code. Avoid over-engineering. Implement only what is requested and necessary.