import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphqlBodySchema } from './schema';
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
      const schema = `
        type Query {
          getAllUsers: String
        }
      `;

      const resolvers = {
        Query: {
          getAllUsers: async () => {
            const users = await fastify.db.users.findMany();
            console.log('===============', users);
            return 'Success';
          },
        },
      };

      const appgql = await Fastify();
      await appgql.register(mercurius, {
        schema,
        resolvers,
      });
      const res =  await appgql.graphql(query);
      console.log(res);
      return 'Success'
    }
  );
};

export default plugin;
