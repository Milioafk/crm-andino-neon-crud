// Conexión a Neon — una sola vez, la usan todas las demás carpetas.
// Pega aquí tu cadena de conexión (Neon → Dashboard → Connect → "Connection string").
import { neon } from "https://esm.sh/@neondatabase/serverless";

const DATABASE_URL = "postgresql://neondb_owner:npg_LZpgfrR9aI8b@ep-dark-pond-b46kh8yk-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export const sql = neon(DATABASE_URL);
