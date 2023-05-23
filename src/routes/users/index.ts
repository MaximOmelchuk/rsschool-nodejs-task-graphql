import { removeIfInclude } from './../../utils/commonUtils';
import { idParamSchema } from './../../utils/reusedSchemas';
import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import { addIfNotInclude, str } from '../../utils/commonUtils';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    const users = await fastify.db.users.findMany();
    return reply.code(200).send(users);
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const id = (request.params as { id: string }).id;
      const user = await fastify.db.users.findOne({ key: 'id', equals: id });
      return user
        ? reply.code(200).send(user)
        : reply.code(404).send(str('User not found'));
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const body: any = request.body;
      if (body?.firstName && body?.lastName && body?.email) {
        const created = await fastify.db.users.create(body);
        return reply.code(200).send(created);
      } else {
        return reply.code(400);
      }
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const id = (request.params as { id: string }).id;

      try {
        await fastify.db.users.delete(id);
        (await fastify.db.users.findMany()).forEach(async (user) => {
          if (user.subscribedToUserIds.includes(id)) {
            removeIfInclude(user.subscribedToUserIds, id);
            await fastify.db.users.change(user.id, user);
          }
        });
        (await fastify.db.posts.findMany()).forEach(async (post) => {
          if (post.userId === id) {
            await fastify.db.posts.delete(post.id);
          }
        });
        (await fastify.db.profiles.findMany()).forEach(async (profile) => {
          if (profile.userId === id) {
            await fastify.db.posts.delete(profile.id);
          }
        });
        return reply.code(200).send(str('User deleted'));
      } catch (err) {
        return reply.code(400).send(str('User not found'));
      }
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const ownID: any = (request.body as { userId: 'string' }).userId;
      const subID: any = (request.params as { id: 'string' }).id;

      const subUser = await fastify.db.users.findOne({
        key: 'id',
        equals: subID,
      });
      const prevUser = await fastify.db.users.findOne({
        key: 'id',
        equals: ownID,
      });
      if (
        !prevUser ||
        !subUser ||
        prevUser.subscribedToUserIds.includes(subUser.id)
      ) {
        return reply.code(400).send(str('User not found'));
      }
      addIfNotInclude(prevUser.subscribedToUserIds, subID);
      const newUser = await fastify.db.users.change(ownID, prevUser);
      return reply.code(200).send(newUser);
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const ownID: any = (request.body as { userId: 'string' }).userId;
      const subID: any = (request.params as { id: 'string' }).id;

      const subUser = await fastify.db.users.findOne({
        key: 'id',
        equals: subID,
      });
      const prevUser = await fastify.db.users.findOne({
        key: 'id',
        equals: ownID,
      });
      if (
        !prevUser ||
        !subUser ||
        !prevUser.subscribedToUserIds.includes(subUser.id)
      ) {
        return reply.code(400).send(str('User not found'));
      }
      removeIfInclude(prevUser.subscribedToUserIds, subID);
      const newUser = await fastify.db.users.change(ownID, prevUser);
      return reply.code(200).send(newUser);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const body: any = request.body;
      const id: any = (request.params as { id: string }).id;
      try {
        const user = await fastify.db.users.change(id, body);
        return reply.code(200).send(user);
      } catch (err) {
        return reply.code(400).send(str('User not found'));
      }
    }
  );
};

export default plugin;
