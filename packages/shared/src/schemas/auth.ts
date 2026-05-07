import { z } from 'zod';

export const UserRegisterSchema = z.object({
  email: z.string({
    required_error: "Email jest wymagany",
  }).email("Niepoprawny format email"),
  password: z.string({
    required_error: "Hasło jest wymagane",
  }).min(8, "Hasło musi mieć co najmniej 8 znaków"),
});

export const UserLoginSchema = z.object({
  email: z.string({
    required_error: "Email jest wymagany",
  }).email("Niepoprawny format email"),
  password: z.string({
    required_error: "Hasło jest wymagane",
  }),
});

export type UserRegisterInput = z.infer<typeof UserRegisterSchema>;
export type UserLoginInput = z.infer<typeof UserLoginSchema>;
