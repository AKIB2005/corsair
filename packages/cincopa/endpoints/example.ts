import { logEventFromContext } from 'corsair/core';
import type { CincopaEndpoints } from '..';
import { makeCincopaRequest } from '../client';
import type { CincopaEndpointOutputs } from './types';

export const get: CincopaEndpoints['exampleGet'] = async (ctx, input) => {
	const response = await makeCincopaRequest<
		CincopaEndpointOutputs['exampleGet']
	>(`example/${input.id}`, ctx.key, { method: 'GET' });

	await logEventFromContext(
		ctx,
		'cincopa.example.get',
		{ ...input },
		'completed',
	);
	return response;
};
