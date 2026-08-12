import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Mínimo 3 caracteres")
  .max(20, "Máximo 20 caracteres")
  .regex(/^[a-z0-9_]+$/, "Solo minúsculas, números y guion bajo");

export const authSchema = z.object({
  email: z.string().trim().email("Correo no válido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

export const signUpSchema = authSchema.extend({
  username: usernameSchema,
  displayName: z.string().trim().min(1, "Escribe tu nombre").max(60),
});

export const profileSchema = z.object({
  username: usernameSchema,
  display_name: z.string().trim().min(1, "Escribe tu nombre").max(60),
  bio: z.string().trim().max(600, "Máximo 600 caracteres"),
  mood: z.string().trim().max(40),
  favorite_quote: z.string().trim().max(120),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color no válido"),
  bg_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color no válido"),
  is_private: z.boolean(),
});

export const textPostSchema = z
  .string()
  .trim()
  .min(1, "No puede estar vacío")
  .max(500, "Máximo 500 caracteres");

export const photoSchema = z.object({
  title: z.string().trim().max(80),
  description: z.string().trim().max(500),
  is_private: z.boolean(),
});