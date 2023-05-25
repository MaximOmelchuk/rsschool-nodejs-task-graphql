import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphqlBodySchema, graphqlSchema } from './schema';
import Fastify from 'fastify';
import mercurius from 'mercurius';
import getResolvers from './resolvers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.post(
    '/',
    {
      schema: {
        body: graphqlBodySchema,
      },
    },
    async function (request, reply) {
      fastify;
      const query = (request.body as any)?.query;
      const variables = (request.body as any)?.variables;

      const appgql = await Fastify();
      await appgql.register(mercurius, {
        schema: graphqlSchema,
        resolvers: getResolvers(fastify, variables),
      });
      return await appgql.graphql(query);
    }
  );
};

export default plugin;
