import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';
import { str } from '../../utils/commonUtils';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<ProfileEntity[]> {
    const profiles = await fastify.db.profiles.findMany();
    return reply.code(200).send(profiles);
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const id = (request.params as { id: string }).id;
      const profile = await fastify.db.profiles.findOne({
        key: 'id',
        equals: id,
      });
      return profile
        ? reply.code(200).send(profile)
        : reply.code(404).send(str('Profile not found'));
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const body: any = request.body;
      const alreadyExist = await fastify.db.profiles.findOne({
        key: 'userId',
        equals: body.userId,
      });
      const memberType = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: body.memberTypeId,
      });

      if (alreadyExist || !memberType) {
        return reply.code(400).send(str('Invalid input'));
      }

      const created = await fastify.db.profiles.create(body);
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
    async function (request, reply): Promise<ProfileEntity> {
      const id = (request.params as { id: string }).id;

      try {
        await fastify.db.profiles.delete(id);

        return reply.code(200).send(str('Profile deleted'));
      } catch (err) {
        return reply.code(400).send(str('Profile not found'));
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const body: any = request.body;
      const id: any = (request.params as { id: string }).id;
      try {
        const profile = await fastify.db.profiles.change(id, body);
        return reply.code(200).send(profile);
      } catch (err) {
        return reply.code(400).send(str('Profile not found'));
      }
    }
  );
};

export default plugin;
