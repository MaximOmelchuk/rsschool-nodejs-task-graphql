import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphqlBodySchema, graphqlSchema } from './schema';
import Fastify from 'fastify';
import mercurius from 'mercurius';
import getResolvers from './resolvers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  const appgql = await Fastify();
  await appgql.register(mercurius, {
    schema: graphqlSchema,
    resolvers: getResolvers(fastify),
    queryDepth: 6,
  });
  fastify.post(
    '/',
    {
      schema: {
        body: graphqlBodySchema,
      },
    },
    async function (request, reply) {
      const query = (request.body as any)?.query;
      const variables = (request.body as any)?.variables;

      return await appgql.graphql(query,undefined, variables);
      // return await appgql.graphql(query);
    }
  );
};

export default plugin;
