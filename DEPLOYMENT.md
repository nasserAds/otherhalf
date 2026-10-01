# OtherHalf production deployment

OtherHalf is a monorepo containing a Next.js frontend and a NestJS + Socket.IO backend. For production, deploy them as two services from the same GitHub repository:

```text
GitHub: nasserAds/otherhalf
        |
        +--> Vercel ------ Next.js frontend
        |
        +--> Render ------ NestJS + Socket.IO backend
                         |
                         +--> Render PostgreSQL
```

Do not deploy the NestJS Socket.IO server as a Vercel Function. The game uses long-lived realtime connections, so the backend needs a persistent web service.

## 1. Deploy the backend on Render

The repository contains `render.yaml`, which defines the backend service and a PostgreSQL database.

1. Open Render and create a **Blueprint** from this GitHub repository.
2. Render should detect `render.yaml`.
3. Create the `otherhalf-backend` web service and `otherhalf-db` database.
4. When Render asks for `CORS_ORIGIN`, temporarily set it to your eventual Vercel URL, for example:

```text
https://otherhalf.vercel.app
```

If you have a custom domain, use that exact origin instead.

The backend build is:

```bash
npm install && npx prisma generate && npm run build
```

The production start command is:

```bash
npm run prisma:deploy && npm run start:prod
```

The backend listens on Render's `PORT` environment variable.

### Backend environment variables

Required:

| Variable | Production value |
|---|---|
| `DATABASE_URL` | Supplied by the Render PostgreSQL database |
| `JWT_SECRET` | Long random secret; `render.yaml` generates one |
| `JWT_EXPIRES_IN` | `12h` |
| `PORT` | Render supplies this; blueprint uses `10000` |
| `CORS_ORIGIN` | Your Vercel frontend origin |
| `THROTTLE_TTL` | `60` |
| `THROTTLE_LIMIT` | `100` |

Never commit real production secrets.

## 2. Prisma production setup

The repository currently contains the Prisma schema and seed script but does not contain a committed `prisma/migrations` history.

For the first production bootstrap, `npm run prisma:deploy` safely uses:

```bash
prisma db push --accept-data-loss=false
```

when no migration SQL exists. This creates the database structure from `schema.prisma` without allowing Prisma to perform destructive changes.

Once the production schema has been established, create and commit a real migration from a development database before making future schema changes:

```bash
cd backend
npx prisma migrate dev --name describe_change
```

Future Render deploys will automatically use:

```bash
prisma migrate deploy
```

as soon as committed migration SQL exists.

After the first database deployment, seed the starter topics once:

```bash
cd backend
npm run prisma:seed
```

Do not run `prisma migrate dev` against the production database.

## 3. Get the backend URL

After Render deploys successfully, it will provide a URL similar to:

```text
https://otherhalf-backend.onrender.com
```

Copy that URL. You will use the same URL for both frontend environment variables because the REST API and Socket.IO server share the same NestJS origin.

## 4. Deploy the frontend on Vercel

1. Import `nasserAds/otherhalf` into Vercel.
2. Keep the repository root as the project root. The committed `vercel.json` already tells Vercel to build the `frontend` workspace.
3. Set these Vercel environment variables for Production:

```text
NEXT_PUBLIC_API_URL=https://otherhalf-backend.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://otherhalf-backend.onrender.com
```

Replace the hostname with the actual Render backend URL.

The frontend code already reads these variables for REST requests and Socket.IO connections.

Do not set them to `/api/backend` in production. That relative URL is useful for local development, but Vercel is not hosting the persistent NestJS Socket.IO process.

4. Deploy.

The production frontend will call:

```text
https://otherhalf-backend.onrender.com/auth/...
https://otherhalf-backend.onrender.com/rooms/...
```

and Socket.IO will connect to the same backend origin.

## 5. Update CORS after Vercel deployment

If your final Vercel URL differs from the URL initially entered in Render, update the Render variable:

```text
CORS_ORIGIN=https://YOUR-FINAL-VERCEL-DOMAIN.vercel.app
```

Then redeploy/restart the backend.

For a custom domain, use the exact origin, for example:

```text
CORS_ORIGIN=https://play.example.com
```

Do not add a trailing slash.

## 6. Verify the production connection

Open the Vercel site and test this order:

1. Register a new user.
2. Log out and log back in on the same browser/device.
3. Create a room.
4. Open the public room list in another browser/device.
5. Join the room.
6. Test lobby chat.
7. Start a match.
8. Test topic voting, debate turns, audience voting, and results.
9. If voice mode is enabled, test voice from two separate devices/networks.

The REST API and Socket.IO server must both be reachable from the browser. Browser developer tools should show requests going to the Render backend rather than `localhost`.

## 7. WebRTC voice notes

Voice chat is peer-to-peer WebRTC with STUN and no TURN server. The NestJS server handles signaling, but media traffic does not pass through the backend.

This means voice may work on many networks but can fail for users behind restrictive NAT/firewalls. That is a separate infrastructure issue from the Vercel/Render deployment.

For a more reliable production voice experience, add a TURN service later and configure the frontend's WebRTC ICE servers.

## 8. Local development after the deployment changes

The local defaults remain compatible with the existing development setup:

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

In another terminal:

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Local frontend defaults continue to use `/api/backend`, while the custom `frontend/server.js` proxy forwards those requests to the local NestJS server.

## 9. Important production checklist

- [ ] Render PostgreSQL created
- [ ] `DATABASE_URL` available to backend
- [ ] Production `JWT_SECRET` generated and kept private
- [ ] Backend deployed and reachable over HTTPS
- [ ] `CORS_ORIGIN` equals the Vercel frontend origin
- [ ] Starter topics seeded
- [ ] Vercel `NEXT_PUBLIC_API_URL` points to Render
- [ ] Vercel `NEXT_PUBLIC_SOCKET_URL` points to Render
- [ ] Frontend deployed
- [ ] Registration/login tested
- [ ] Two-browser room test completed
- [ ] Chat tested
- [ ] Match flow tested
- [ ] Voice tested on two real devices/networks

## Architecture summary

```text
Browser
  |
  | HTTPS REST + Socket.IO polling
  v
Vercel Next.js ------------------------------+
                                             |
                                             v
                                  Render NestJS backend
                                             |
                                  +----------+----------+
                                  |                     |
                                  v                     v
                             PostgreSQL          WebRTC signaling
                                                       |
                                                       v
                                                 Browser <-> Browser
```
