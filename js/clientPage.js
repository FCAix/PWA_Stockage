import { requireAuth } from "./authGuard.js";

await requireAuth(["admin","client"]);