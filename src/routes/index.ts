import { Hono } from "hono";
import { AppEnv } from "../types/hono";
import games from "./games";
import auth from "./auth";
import providers from "./providers";
import servers from "./servers";

import serverAccess from "./server-access";

const app = new Hono<AppEnv>();

app.route("/auth", auth);
app.route("/games", games);
app.route("/providers", providers);
app.route("/servers", servers);
app.route("/server-access", serverAccess);

export default app;
