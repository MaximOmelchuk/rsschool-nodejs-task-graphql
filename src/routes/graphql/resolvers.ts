import { addIfNotInclude, removeIfInclude } from './../../utils/commonUtils';
import { MemberTypeEntity } from './../../utils/DB/entities/DBMemberTypes';
import {
  CreateUserDTO,
  UserEntity,
  UserEntityWithSubscribersChild,
  UserEntityWithSubscribersParent,
} from './../../utils/DB/entities/DBUsers';
import { PostEntity, CreatePostDTO } from './../../utils/DB/entities/DBPosts';
import {
  ProfileEntity,
  CreateProfileDTO,
} from './../../utils/DB/entities/DBProfiles';
import { FastifyInstance } from 'fastify';
import {
  UserEntityWithExtraData,
  UserEntityWithPosts,
  UserEntityWithProfile,
} from '../../utils/DB/entities/DBUsers';

const getResolvers = (fastify: FastifyInstance) => {
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
      getUserById: async (_: unknown, context: any) => {
        return await fastify.db.users.findOne({
          key: 'id',
          equals: context.id,
        });
      },
      getProfileById: async (_: unknown, context: any) => {
        return await fastify.db.profiles.findOne({
          key: 'id',
          equals: context?.id,
        });
      },
      getPostById: async (_: unknown, context: any) => {
        return await fastify.db.posts.findOne({
          key: 'id',
          equals: context?.id,
        });
      },
      geMemberTypeById: async (_: unknown, context: any) => {
        return await fastify.db.memberTypes.findOne({
          key: 'id',
          equals: context?.id,
        });
      },
      getAllUsersWithExtraData: async () => {
        const users = await fastify.db.users.findMany();

        // const batchFunction = async () => {
        //   const extraUsers = users.map(async (user) => {
        //     const extraUser: UserEntityWithExtraData = { ...user };
        //     extraUser.posts = await fastify.db.posts.findMany({
        //       key: 'userId',
        //       equals: user.id,
        //     });
        //     extraUser.profile = await fastify.db.profiles.findOne({
        //       key: 'userId',
        //       equals: user.id,
        //     });
        //     extraUser.memberTypes = await fastify.db.memberTypes.findMany({
        //       key: 'id',
        //       equals: extraUser.profile?.memberTypeId || '',
        //     });
        //     return extraUser;
        //   });
        //   const result = await Promise.all(extraUsers);
        //   return result;
        // }

        // const loader = new DataLoader(batchFunction)
        return users;
      },

      getUserByIdWithExtraData: async (_: unknown, context: any) => {
        const user = await fastify.db.users.findOne({
          key: 'id',
          equals: context.id || '',
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
      getUserByIdWithPosts: async (_: unknown, context: any) => {
        const user = await fastify.db.users.findOne({
          key: 'id',
          equals: context.id || '',
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
      getAllUsersWithSubscribersUsers: async () => {
        const getUserWithSubscibers = async (
          id: string,
          fastify: FastifyInstance,
          hasSubSubcribers: boolean
        ) => {
          const user: UserEntity | null = await fastify.db.users.findOne({
            key: 'id',
            equals: id,
          });
          if (!user) {
            return null;
          }
          const subsUsers: UserEntityWithSubscribersParent[] = [];
          const subsIds = user.subscribedToUserIds;
          subsIds.forEach(async (id) => {
            const subUser = await getUserWithSubscibers(id, fastify, false);
            if (subUser) subsUsers.push(subUser);
          });

          if (hasSubSubcribers) {
            const extraUser: UserEntityWithSubscribersParent = { ...user };
            extraUser.subscribedToUser = subsUsers;
            return extraUser;
          } else {
            const extraUser: UserEntityWithSubscribersChild = { ...user };
            extraUser.subscribedToUser = subsUsers;
            return extraUser;
          }
        };

        const usersIds = (await fastify.db.users.findMany()).map(
          (item) => item.id
        );
        const usersArr: UserEntityWithSubscribersParent[] = [];
        usersIds.forEach(async (id) => {
          const user = await getUserWithSubscibers(id, fastify, true);
          if (user) {
            usersArr.push(user);
          }
        });
        return usersArr;
      },
    },
    Mutation: {
      createUser: async (_: unknown, context: any) => {
        const user: CreateUserDTO = context.user;
        console.log('-----context.user', context.user)
        const created: UserEntity = await fastify.db.users.create(user);
        return created;
      },
      createProfile: async (_: unknown, context: any) => {
        const profile: CreateProfileDTO = context.profile;
        const created: ProfileEntity = await fastify.db.profiles.create(
          profile
        );
        return created;
      },
      createPost: async (_: unknown, context: any) => {
        const post: CreatePostDTO = context.post;
        const created: PostEntity = await fastify.db.posts.create(post);
        return created;
      },
      updateUser: async (_: unknown, context: any) => {
        const id: string = context.id;
        const update: any = context.update;
        const created: UserEntity = await fastify.db.users.change(id, update);
        return created;
      },
      updateProfile: async (_: unknown, context: any) => {
        const id: string = context.id;
        const update: any = context.update;
        const created: ProfileEntity = await fastify.db.profiles.change(
          id,
          update
        );
        return created;
      },
      updatePost: async (_: unknown, context: any) => {
        const id: string = context.id;
        const update: any = context.update;
        const created: PostEntity = await fastify.db.posts.change(id, update);
        return created;
      },
      updateMemberType: async (_: unknown, context: any) => {
        const id: string = context.id;
        const update: any = context.update;
        const created: MemberTypeEntity = await fastify.db.memberTypes.change(
          id,
          update
        );
        return created;
      },
      subscribeTo: async (_: unknown, context: any) => {
        const ownID: string = context.ownID;
        const subID: any = context.subID;
        const sub: UserEntity | null = await fastify.db.users.findOne({
          key: 'id',
          equals: subID,
        });
        if (!sub) return null;
        addIfNotInclude(sub.subscribedToUserIds, ownID);
        const updated = await fastify.db.users.change(subID, sub);
        return updated;
      },
      unsubscribeFrom: async (_: unknown, context: any) => {
        const ownID: string = context.ownID;
        const subID: any = context.subID;
        const own: UserEntity | null = await fastify.db.users.findOne({
          key: 'id',
          equals: ownID,
        });
        if (!own) return null;
        removeIfInclude(own.subscribedToUserIds, subID);
        const updated = await fastify.db.users.change(ownID, own);
        return updated;
      },
    },
  };
};

export default getResolvers;
