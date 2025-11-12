# Development Log

## 2025-11-07 00:00

- Task: Cleanup version-suffixed imports and Vite aliases; restart dev server; verify UI.
- Changes:
  - Updated `lucide-react` imports to base package across UI components (e.g., `context-menu.tsx`, `accordion.tsx`, `checkbox.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `navigation-menu.tsx`, `pagination.tsx`, `radio-group.tsx`, `resizable.tsx`, `sidebar.tsx`, `sheet.tsx`, `calendar.tsx`, `select.tsx`, `input-otp.tsx`, `command.tsx`, `menubar.tsx`, `breadcrumb.tsx`, `carousel.tsx`).
  - Removed obsolete version-suffixed aliases from `vite.config.ts` for `vaul`, `sonner`, `recharts`, `next-themes`, and `lucide-react`.
  - Left `class-variance-authority@0.7.1` alias intact temporarily because several components still import using the suffixed alias.
- Issues:
  - Port `3000` was in use; dev server started on `http://localhost:3001/`.
  - Preview open timed out in the IDE, despite the server reporting readiness.
- Solutions:
  - Restarted the dev server; confirmed it serves on `http://localhost:3001/`.
  - Will continue the phased cleanup by updating `class-variance-authority` imports next, then removing its alias.
 
## 2025-11-07 17:56

- Task: Remove remaining version-suffixed imports; fix TypeScript issues; verify dev server; attempt preview.
- Changes:
  - Replaced version-suffixed imports with base packages in:
    - `dropdown-menu.tsx` (`@radix-ui/react-dropdown-menu`)
    - `alert-dialog.tsx` (`@radix-ui/react-alert-dialog`)
    - `alert.tsx` (`class-variance-authority`)
    - `avatar.tsx` (`@radix-ui/react-avatar`)
    - `context-menu.tsx` (`@radix-ui/react-context-menu`)
    - `tooltip.tsx` (`@radix-ui/react-tooltip`)
    - `navigation-menu.tsx` (`@radix-ui/react-navigation-menu`, `class-variance-authority`)
    - `form.tsx` (`@radix-ui/react-label`, `@radix-ui/react-slot`)
    - `radio-group.tsx` (`@radix-ui/react-radio-group`)
    - `accordion.tsx` (`@radix-ui/react-accordion`)
    - `collapsible.tsx` (`@radix-ui/react-collapsible`)
    - `tabs.tsx` (`@radix-ui/react-tabs`)
    - `checkbox.tsx` (`@radix-ui/react-checkbox`)
    - `menubar.tsx` (`@radix-ui/react-menubar`)
    - `toggle-group.tsx` (`@radix-ui/react-toggle-group`, `class-variance-authority`)
    - `command.tsx` (`cmdk`)
    - `carousel.tsx` (`embla-carousel-react`)
    - Previously updated: `aspect-ratio.tsx`, `resizable.tsx`, `label.tsx`, `scroll-area.tsx`, `select.tsx`, `sheet.tsx`, `separator.tsx`, `switch.tsx`, `slider.tsx`, `progress.tsx`, `hover-card.tsx`, `popover.tsx`, `sidebar.tsx`, `calendar.tsx`, `input-otp.tsx`, `button.tsx`, `badge.tsx`, `toggle.tsx`, `breadcrumb.tsx`.
  - Typed `calendar.tsx` icon component props to eliminate implicit `any` on `className`.
  - Fixed `pagination.tsx` duplicate `size` prop by using `Omit<...,'size'>` for `PaginationPrevious` and `PaginationNext`.
- Issues:
  - Dev server shows a Fast Refresh warning: "badgeVariants export is incompatible" (HMR-only warning; not a build failure).
  - Preview open timed out in the IDE again despite server running.
- Solutions:
  - Verified Vite dev server remains running on `http://localhost:3001/` and hot-reloads changes.
  - Adjusted icon typing and prop spreads to satisfy TypeScript.
  - Initiated preview open via IDE tool (timeout appears tooling-related; manual browser access recommended as fallback).

## 2025-11-07 18:20

- Task: Fix missing modules/types for react-hook-form, embla-carousel-react, and cmdk.
- Changes:
  - Updated `app/components/ui/form.tsx` import to use `react-hook-form` base package (removed `@7.55.0` suffix).
  - Added dependencies to `package.json`: `react-hook-form@^7.55.0`, `embla-carousel-react@^8.6.0`, `cmdk@^1.1.1`.
  - Appended ambient module declarations in `scripts/node-stubs.d.ts` for `'react-hook-form'`, `'embla-carousel-react'`, and `'cmdk'` to unblock TypeScript until install completes.
- Issues:
  - Installing packages via IDE timed out; dev server already running on ports `3000` and `3001` in separate terminals.
- Solutions:
  - Proceeded with `package.json` updates and type stubs to clear TypeScript diagnostics.
  - Next step: Run `npm install` (or `yarn add` for each) manually in `basalt_cdp_mvp_program` to fetch modules so the bundler can resolve imports at runtime.

## 2025-11-07 18:13

- Task: Install dependencies and restore TypeScript types.
- Changes:
  - Ran `npm install --legacy-peer-deps` to resolve a peer dependency conflict between `anchor-bankrun@0.5.0` and `@coral-xyz/anchor@0.32.1`.
  - Successfully installed: `react-hook-form`, `embla-carousel-react`, `cmdk`.
  - Removed temporary ambient module declarations from `scripts/node-stubs.d.ts` for `'react-hook-form'`, `'embla-carousel-react'`, and `'cmdk'` so TypeScript uses real library types.
- Issues:
  - Initial `npm install` failed due to peer dependency resolution error.
- Solutions:
  - Used the `--legacy-peer-deps` flag to bypass the peer conflict and complete installation.