[Project README](../README.md) › [Docs](README.md) › Entra app registration

# Entra app registration (for the customer)

These steps are done in Azure by whoever administers the app registration, not in the dashboard. Changing the app registration needs an owner of the app or the Entra role *Application Administrator*. Assigning roles needs an owner of the enterprise application or *Cloud Application Administrator*.

The dashboard has no user management. Its **Admin** role only allows uploading data and running the analysis; it does not make anyone an Entra administrator. A new user must first exist in the organisation's Entra ID, which IT manages, and is then given a role here.

The dashboard and the API use the same app registration. For sign-in from the dashboard to work, it needs:

1. **Authentication** → add the platform *Single-page application* with a redirect URI for every address the dashboard runs on: `http://localhost:5173` for `npm run dev`, `http://localhost:8080` for Docker Compose, and the real address in production.
2. **Expose an API** → set the Application ID URI to `api://<client id>` and add a scope named `access_as_user`.
3. **Manifest** → set `requestedAccessTokenVersion` to `2`. The API only accepts v2 tokens, whose audience is the client ID.
4. **App roles** → create two roles for *Users/Groups*: `Admin` with the value `admin`, and `Bruker` with the value `user`.

Who gets which role is managed under **Enterprise applications** → the app:

- **Users and groups** → assign each user a role. A user with both roles counts as admin. Assigning a role to a group instead, so its members get it, needs the Entra ID P1 or P2 licence.
- **Properties** → set **Assignment required?** to **Yes**, so users without a role cannot sign in at all.

A user's role reaches the API inside the token, so a role change takes effect the next time they sign in.

The IDs go into `.env`, see [`.env.example`](../.env.example). The code that uses them is in [`backend/src/api`](../backend/src/api/README.md) and [`frontend/src/auth`](../frontend/src/README.md#auth).
