import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';
import { str } from '../../utils/commonUtils';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    MemberTypeEntity[]
  > {
    const types = await fastify.db.memberTypes.findMany();
    return reply.code(200).send(types);
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const id = (request.params as { id: string }).id;
      const type = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: id,
      });
      return type
        ? reply.code(200).send(type)
        : reply.code(404).send(str('Types not found'));
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const body: any = request.body;
      const id: any = (request.params as { id: string }).id;
      try {
        const type = await fastify.db.memberTypes.change(id, body);
        return reply.code(200).send(type);
      } catch (err) {
        return reply.code(400).send(str('Type not found'));
      }
    }
  );
};

export default plugin;
