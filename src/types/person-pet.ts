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
  originCity: z.string().nullable().optional(),
});

// Schema para una persona con sus mascotas (array)
export const personWithPetsSchema = z.object({
  person: personSchema,
  pets: z.array(petSchema),
});

// Schema para múltiples personas (array de personas con mascotas)
export const peopleWithPetsSchema = z.array(personWithPetsSchema);

export type Person = z.infer<typeof personSchema>;
export type Pet = z.infer<typeof petSchema>;
export type PersonWithPets = z.infer<typeof personWithPetsSchema>;
export type PeopleWithPets = z.infer<typeof peopleWithPetsSchema>;
