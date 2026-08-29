import { z } from 'zod';

const ExampleGetInputSchema = z.object({
	id: z.string(),
});

export type ExampleGetInput = z.infer<typeof ExampleGetInputSchema>;

const ExampleGetResponseSchema = z.object({
	id: z.string(),
});

export type ExampleGetResponse = z.infer<typeof ExampleGetResponseSchema>;

export type CincopaEndpointInputs = {
	exampleGet: ExampleGetInput;
};

export type CincopaEndpointOutputs = {
	exampleGet: ExampleGetResponse;
};

export const CincopaEndpointInputSchemas = {
	exampleGet: ExampleGetInputSchema,
} as const;

export const CincopaEndpointOutputSchemas = {
	exampleGet: ExampleGetResponseSchema,
} as const;
