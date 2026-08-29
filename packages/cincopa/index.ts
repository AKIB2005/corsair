import type {
	AuthTypes,
	BindEndpoints,
	BindWebhooks,
	CorsairEndpoint,
	CorsairErrorHandler,
	CorsairPlugin,
	CorsairPluginContext,
	CorsairWebhook,
	KeyBuilderContext,
	PickAuth,
	PluginAuthConfig,
	PluginPermissionsConfig,
	RequiredPluginEndpointMeta,
	RequiredPluginEndpointSchemas,
	RequiredPluginWebhookSchemas,
} from 'corsair/core';
import { Example } from './endpoints';
import type {
	CincopaEndpointInputs,
	CincopaEndpointOutputs,
} from './endpoints/types';
import {
	CincopaEndpointInputSchemas,
	CincopaEndpointOutputSchemas,
} from './endpoints/types';
import { errorHandlers } from './error-handlers';
import { CincopaSchema } from './schema';
import { ExampleWebhooks } from './webhooks';
import { resolveCincopaOAuthWebhookTenantLink } from './webhooks/oauth-tenant-link';
import { matchCincopaTenantWebhook } from './webhooks/tenant-matcher';
import type { CincopaWebhookOutputs, ExampleEvent } from './webhooks/types';
import { ExampleEventSchema } from './webhooks/types';

export type CincopaPluginOptions = {
	authType?: PickAuth<'api_key' | 'oauth_2'>;
	key?: string;
	webhookSecret?: string;
	hooks?: InternalCincopaPlugin['hooks'];
	webhookHooks?: InternalCincopaPlugin['webhookHooks'];
	errorHandlers?: CorsairErrorHandler;
	permissions?: PluginPermissionsConfig<typeof cincopaEndpointsNested>;
};

export type CincopaContext = CorsairPluginContext<
	typeof CincopaSchema,
	CincopaPluginOptions
>;

export type CincopaKeyBuilderContext = KeyBuilderContext<CincopaPluginOptions>;

export type CincopaBoundEndpoints = BindEndpoints<
	typeof cincopaEndpointsNested
>;

type CincopaEndpoint<K extends keyof CincopaEndpointOutputs> = CorsairEndpoint<
	CincopaContext,
	CincopaEndpointInputs[K],
	CincopaEndpointOutputs[K]
>;

export type CincopaEndpoints = {
	exampleGet: CincopaEndpoint<'exampleGet'>;
};

type CincopaWebhook<
	K extends keyof CincopaWebhookOutputs,
	TEvent,
> = CorsairWebhook<CincopaContext, TEvent, CincopaWebhookOutputs[K]>;

export type CincopaWebhooks = {
	example: CincopaWebhook<'example', ExampleEvent>;
};

export type CincopaBoundWebhooks = BindWebhooks<CincopaWebhooks>;

const cincopaEndpointsNested = {
	example: {
		get: Example.get,
	},
} as const;

const cincopaWebhooksNested = {
	example: {
		example: ExampleWebhooks.example,
	},
} as const;

export const cincopaEndpointSchemas = {
	'example.get': {
		input: CincopaEndpointInputSchemas.exampleGet,
		output: CincopaEndpointOutputSchemas.exampleGet,
	},
} as const satisfies RequiredPluginEndpointSchemas<
	typeof cincopaEndpointsNested
>;

const cincopaWebhookSchemas = {
	'example.example': {
		description: 'An example webhook event',
		payload: ExampleEventSchema,
		response: ExampleEventSchema,
	},
} as const satisfies RequiredPluginWebhookSchemas<typeof cincopaWebhooksNested>;

const defaultAuthType: AuthTypes = 'api_key' as const;

const cincopaEndpointMeta = {
	'example.get': {
		riskLevel: 'read',
		description: 'Get an example resource by ID',
	},
} as const satisfies RequiredPluginEndpointMeta<typeof cincopaEndpointsNested>;

export const cincopaAuthConfig = {
	api_key: {
		account: ['tenant_external_id'] as const,
	},
	oauth_2: {
		account: ['tenant_external_id'] as const,
	},
} as const satisfies PluginAuthConfig;

export type BaseCincopaPlugin<T extends CincopaPluginOptions> = CorsairPlugin<
	'cincopa',
	typeof CincopaSchema,
	typeof cincopaEndpointsNested,
	typeof cincopaWebhooksNested,
	T,
	typeof defaultAuthType
>;

export type InternalCincopaPlugin = BaseCincopaPlugin<CincopaPluginOptions>;

export type ExternalCincopaPlugin<T extends CincopaPluginOptions> =
	BaseCincopaPlugin<T>;

export function cincopa<const T extends CincopaPluginOptions>(
	incomingOptions: CincopaPluginOptions & T = {} as CincopaPluginOptions & T,
): ExternalCincopaPlugin<T> {
	const options = {
		...incomingOptions,
		authType: incomingOptions.authType ?? defaultAuthType,
	};
	return {
		id: 'cincopa',
		authConfig: cincopaAuthConfig,
		schema: CincopaSchema,
		options: options,
		hooks: options.hooks,
		webhookHooks: options.webhookHooks,
		endpoints: cincopaEndpointsNested,
		webhooks: cincopaWebhooksNested,
		endpointMeta: cincopaEndpointMeta,
		endpointSchemas: cincopaEndpointSchemas,
		webhookSchemas: cincopaWebhookSchemas,
		pluginWebhookMatcher: (request) => {
			const headers = request.headers;
			// TODO: Update to match your webhook signature headers
			return 'x-cincopa-signature' in headers;
		},
		pluginTenantWebhookMatcher: matchCincopaTenantWebhook,
		oauthWebhookTenantLinkResolver: resolveCincopaOAuthWebhookTenantLink,
		errorHandlers: {
			...errorHandlers,
			...options.errorHandlers,
		},
		keyBuilder: async (ctx: CincopaKeyBuilderContext, source) => {
			if (source === 'webhook' && options.webhookSecret) {
				return options.webhookSecret;
			}

			if (source === 'webhook') {
				const res = await ctx.keys.get_webhook_signature();
				return res ?? '';
			}

			if (source === 'endpoint' && options.key) {
				return options.key;
			}

			if (source === 'endpoint' && ctx.authType === 'api_key') {
				const res = await ctx.keys.get_api_key();
				return res ?? '';
			}

			if (source === 'endpoint' && ctx.authType === 'oauth_2') {
				const res = await ctx.keys.get_access_token();
				return res ?? '';
			}

			return '';
		},
	} satisfies InternalCincopaPlugin;
}

export type {
	CincopaEndpointInputs,
	CincopaEndpointOutputs,
	ExampleGetInput,
	ExampleGetResponse,
} from './endpoints/types';
export type {
	CincopaWebhookOutputs,
	ExampleEvent,
} from './webhooks/types';
