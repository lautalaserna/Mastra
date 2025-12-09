import { z } from "zod";

export const personSchema = z.object({
  name: z.string(),
  age: z.number().int().nullable().optional(),
  city: z.string().nullable().optional(),
  job: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
});

export const petSchema = z.object({
  name: z.string().nullable().optional(),
  species: z.string().nullable().optional(),
  age: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const personPetSchema = z.object({
  person: personSchema,
  pet: petSchema,
});

export type Person = z.infer<typeof personSchema>;
export type Pet = z.infer<typeof petSchema>;
export type PersonPet = z.infer<typeof personPetSchema>;
