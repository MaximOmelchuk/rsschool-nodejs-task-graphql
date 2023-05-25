import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphqlBodySchema, graphqlSchema } from './schema';
import Fastify from 'fastify';
import mercurius from 'mercurius';

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
      const query = (request.body as any).query;
      const variables = (request.body as any).variables;

      const resolvers = {
        Query: {
          getAllUsers: async () => {
            return await fastify.db.users.findMany();
          },
          getAllProfiles: async () => {
            return await fastify.db.profiles.findMany();
          },
          getAllPosts: async () => {
            return await fastify.db.posts.findMany();
          },
          getAllMemberTypes: async () => {
            return await fastify.db.memberTypes.findMany();
          },
          getUserById: async (id: string) => {
            return await fastify.db.users.findOne({
              key: 'id',
              equals: variables?.id,
            });
          },
          getProfileById: async (id: string) => {
            return await fastify.db.profiles.findOne({
              key: 'id',
              equals: variables?.id,
            });
          },
          getPostById: async (id: string) => {
            return await fastify.db.posts.findOne({
              key: 'id',
              equals: variables?.id,
            });
          },
          geMemberTypeById: async (id: string) => {
            return await fastify.db.memberTypes.findOne({
              key: 'id',
              equals: variables?.id,
            });
          },
        },
      };

      const appgql = await Fastify();
      await appgql.register(mercurius, {
        schema: graphqlSchema,
        resolvers,
      });
      return await appgql.graphql(query);
    }
  );
};

export default plugin;
