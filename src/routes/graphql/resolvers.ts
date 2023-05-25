import { PostEntity } from './../../utils/DB/entities/DBPosts';
import { ProfileEntity } from './../../utils/DB/entities/DBProfiles';
import { FastifyInstance } from 'fastify';
import {
  UserEntityWithExtraData,
  UserEntityWithPosts,
  UserEntityWithProfile,
} from '../../utils/DB/entities/DBUsers';

const getResolvers = (fastify: FastifyInstance, variables: any) => {
  return {
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
      getAllUsersWithExtraData: async () => {
        const users = await fastify.db.users.findMany();
        const extraUsers = users.map(async (user) => {
          const extraUser: UserEntityWithExtraData = { ...user };
          extraUser.posts = await fastify.db.posts.findMany({
            key: 'userId',
            equals: user.id,
          });
          extraUser.profile = await fastify.db.profiles.findOne({
            key: 'userId',
            equals: user.id,
          });
          extraUser.memberTypes = await fastify.db.memberTypes.findMany({
            key: 'id',
            equals: extraUser.profile?.memberTypeId || '',
          });
          return extraUser;
        });
        const result = await Promise.all(extraUsers);
        return result;
      },

      getUserByIdWithExtraData: async () => {
        const user = await fastify.db.users.findOne({
          key: 'id',
          equals: variables.id || '',
        });
        if (!user) return null;
        const extraUser: UserEntityWithExtraData = { ...user };
        extraUser.posts = await fastify.db.posts.findMany({
          key: 'userId',
          equals: user.id,
        });
        extraUser.profile = await fastify.db.profiles.findOne({
          key: 'userId',
          equals: user.id,
        });
        extraUser.memberTypes = await fastify.db.memberTypes.findMany({
          key: 'id',
          equals: extraUser.profile?.memberTypeId || '',
        });
        return extraUser;
      },
      getAllUsersWithProfile: async () => {
        const users = await fastify.db.users.findMany();
        const extraUsers = users.map(async (user) => {
          const extraUser: UserEntityWithProfile = { ...user };
          const userSubscribedToPromise: ProfileEntity[] = [];
          user.subscribedToUserIds.forEach(async (id) => {
            const profile = await fastify.db.profiles.findOne({
              key: 'userId',
              equals: id,
            });
            if (profile) {
              userSubscribedToPromise.push(profile);
            }
          });
          const userSubscribedTo = await Promise.all(userSubscribedToPromise);
          extraUser.userSubscribedTo = userSubscribedTo;
          return extraUser;
        });
        const result = await Promise.all(extraUsers);
        return result;
      },
      getUserByIdWithPosts: async () => {
        const user = await fastify.db.users.findOne({
          key: 'id',
          equals: variables.id || '',
        });
        if (!user) return null;
        const extraUser: UserEntityWithPosts = { ...user };
        const subscribedToUser: PostEntity[] = [];
        user.subscribedToUserIds.forEach(async (id) => {
          const posts: PostEntity[] = await fastify.db.posts.findMany({
            key: 'userId',
            equals: id,
          });
          subscribedToUser.push(...posts);
        });
        extraUser.subscribedToUser = subscribedToUser;
        return extraUser;
      },
    },
  };
};

export default getResolvers;
