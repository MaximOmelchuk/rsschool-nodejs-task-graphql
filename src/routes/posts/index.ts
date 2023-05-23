import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';
import { str } from '../../utils/commonUtils';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    const posts = await fastify.db.posts.findMany();
    return reply.code(200).send(posts);
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const id = (request.params as { id: string }).id;
      const post = await fastify.db.posts.findOne({
        key: 'id',
        equals: id,
      });
      return post
        ? reply.code(200).send(post)
        : reply.code(404).send(str('Post not found'));
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const body: any = request.body;

      const created = await fastify.db.posts.create(body);
      return reply.code(200).send(created);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const id = (request.params as { id: string }).id;

      try {
        await fastify.db.posts.delete(id);

        return reply.code(200).send(str('Post deleted'));
      } catch (err) {
        return reply.code(400).send(str('Post not found'));
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const body: any = request.body;
      const id: any = (request.params as { id: string }).id;
      try {
        const post = await fastify.db.posts.change(id, body);
        return reply.code(200).send(post);
      } catch (err) {
        return reply.code(400).send(str('Post not found'));
      }
    }
  );
};

export default plugin;
