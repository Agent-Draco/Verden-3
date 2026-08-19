# Instructions

## Development Guidelines

- **Do not rewrite history**: This project is connected to Lovable. Avoid rewriting published git history — force pushing, or rebasing/amending/squashing commits that are already pushed — as it rewrites history on Lovable's side and the user will likely lose their project history. Commits you push to the connected branch sync back to Lovable and show up in the editor, so keep the branch in a working state.

## Routing Conventions

This project uses TanStack Start, which uses **file-based routing**. Every `.tsx` file in `src/routes/` defines a route.

- Do **not** create `src/pages/`, `src/routes/_app/index.tsx`, or `app/layout.tsx`. The only root layout is `src/routes/__root.tsx`.

### File and URL Mapping

| File                     | URL                                                     |
| ------------------------ | ------------------------------------------------------- |
| `index.tsx`              | `/`                                                     |
| `about.tsx`              | `/about`                                                |
| `users/index.tsx`        | `/users`                                                |
| `users/$id.tsx`          | `/users/:id` (dynamic — bare `$`, no curly braces)      |
| `posts/{-$category}.tsx` | `/posts/:category?` (optional segment)                  |
| `files/$.tsx`            | `/files/*` (splat — read via `_splat` param, never `*`) |
| `_layout.tsx`            | layout route (renders children via `<Outlet />`)        |
| `__root.tsx`             | app shell — wraps every page; preserve `<Outlet />`     |

**Note**: `routeTree.gen.ts` is auto-generated. Don't edit it by hand.
