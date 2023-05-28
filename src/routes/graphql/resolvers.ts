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
import DataLoader = require('dataloader');

const getResolvers = (fastify: FastifyInstance) => {
  const usersDL = new DataLoader(async function (keys) {
    const allUsers = await fastify.db.users.findMany();
    if (!keys.length) return allUsers;
    return keys?.map((id) => allUsers.find((user) => user.id === id));
  });
  const profilesDLUsersID = new DataLoader(async function (keys) {
    const allProfiles = await fastify.db.profiles.findMany();
    if (!keys.length) return allProfiles;
    return keys?.map((id) =>
      allProfiles.find((profile) => profile.userId === id)
    );
  });
  const postsDLUsersID = new DataLoader(async function (keys) {
    const allPosts = await fastify.db.posts.findMany();
    if (!keys.length) return [allPosts];
    const results = keys?.map((id) =>
      allPosts.filter((posts) => posts.userId === id)
    );
    return results;
  });
  const memberTypesDL = new DataLoader(async function (keys) {
    const allTypes = await fastify.db.memberTypes.findMany();
    if (!keys.length) return allTypes;
    return keys?.map((id) => allTypes.find((type) => type.id === id));
  });
  const subscribersDL = new DataLoader(async function (keys) {
    const allUsers = await fastify.db.users.findMany();
    return keys?.map((id) =>
      allUsers.filter((user) => user.subscribedToUserIds.includes(id as string))
    );
  });

  return {
    Query: {
      getAllUsers: async () => {
        return await usersDL.loadMany([]);
      },
      getAllProfiles: async () => {
        return await profilesDLUsersID.loadMany([]);
      },
      getAllPosts: async () => {
        return await postsDLUsersID.loadMany([]);
      },
      getAllMemberTypes: async () => {
        return await memberTypesDL.loadMany([]);
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
        const users: UserEntity[] = [];
        (await usersDL.loadMany([])).forEach((user) => {
          if (user && 'id' in user) users.push(user);
        });
        const usersIDs = users.map((user) => user.id);
        const profiles = (await profilesDLUsersID.loadMany(usersIDs)).map(
          (item) => (item && 'id' in item ? item : undefined)
        );
        const posts = (await postsDLUsersID.loadMany(usersIDs)).map((item) =>
          Array.isArray(item) ? item : []
        );
        const typesIDs = profiles.map((item) =>
          item && 'id' in item ? item?.memberTypeId : undefined
        );
        const types = (await memberTypesDL.loadMany(typesIDs)).map((item) =>
          item && 'id' in item ? item : undefined
        );
        const result: UserEntityWithExtraData[] = [...users];
        result.forEach((_, index) => {
          result[index].posts = posts[index];
          result[index].profile = profiles[index];
          result[index].memberTypes = types[index];
        });
        return result;
      },

      getUserByIdWithExtraData: async (_: unknown, context: any) => {
        const userID: string = context.id;
        const user = await fastify.db.users.findOne({
          key: 'id',
          equals: userID,
        });
        if (!user) return null;
        const profile = await profilesDLUsersID.load(userID);
        const posts: PostEntity[] = [];
        (await postsDLUsersID.loadMany([userID])).forEach((post) => {
          if (Array.isArray(post)) {
            posts.concat(...post);
          }
        });
        const typeID = profile?.memberTypeId;
        const type = typeID ? await memberTypesDL.load(typeID) : undefined;
        const result: UserEntityWithExtraData = { ...user };
        result.posts = posts;
        result.profile = profile;
        result.memberTypes = type;
        return result;
      },

      getAllUsersWithProfile: async () => {
        const users: UserEntity[] = [];
        (await usersDL.loadMany([])).forEach((user) => {
          if (user && 'id' in user) users.push(user);
        });
        const usersIDs = users.map((item) => item.id);
        const subs = (await subscribersDL.loadMany(usersIDs)).map((item) =>
          Array.isArray(item) ? item : undefined
        );
        const subsProfilesPromise = subs.map((users) => {
          if (Array.isArray(users)) {
            return Promise.all(
              users.map((sub) => {
                return profilesDLUsersID.load(sub.id);
              })
            );
          } else {
            return undefined;
          }
        });
        const subsProfiles = await Promise.all(subsProfilesPromise);
        const result: UserEntityWithProfile[] = [...users];
        result.forEach(async (_, index) => {
          result[index].userSubscribedTo = subsProfiles[index];
        });
        return result;
      },

      getUserByIdWithPosts: async (_: unknown, context: any) => {
        const id: string = context.id;
        const user = await usersDL.load(id);
        if (!user) return null;
        const subsIDs = user.subscribedToUserIds;
        const subsProfiles = (await postsDLUsersID.loadMany(subsIDs)).map(
          (item) => (Array.isArray(item) ? item : [])
        );
        const result: UserEntityWithPosts = { ...user };
        result.subscribedToUser = subsProfiles.flat();
        return result;
      },

      getAllUsersWithSubscribersUsers: async () => {
        const allUsers: UserEntity[] = [];
        (await usersDL.loadMany([])).forEach((user) => {
          if (user && 'id' in user) allUsers.push(user);
        });
        const addSubs = async (users: UserEntity[], subsHasSubs: Boolean) => {
          if (subsHasSubs) {
            const extraUsers: UserEntityWithSubscribersParent[] =
              await Promise.all(
                [...users].map(async (user, index) => {
                  const extraUser: UserEntityWithSubscribersParent = {
                    ...user,
                  };
                  const subToMe = (
                    await usersDL.loadMany(user.subscribedToUserIds)
                  ).map((user) => (user && 'id' in user ? user : undefined));
                  const clearSubToMe: UserEntity[] = [];
                  subToMe.forEach((item) => {
                    if (!!item) {
                      clearSubToMe.push(item);
                    }
                  });

                  const meSubTo: UserEntity[] = [];
                  allUsers.forEach((item) => {
                    if (item.subscribedToUserIds.includes(user.id)) {
                      meSubTo.push(item);
                    }
                  });

                  extraUser.subscribedToUser = await addSubs(
                    clearSubToMe,
                    false
                  );
                  extraUser.userSubscribedTo = await addSubs(meSubTo, false);
                  return extraUser;
                })
              );

            const res = await Promise.all(extraUsers);
            return res;
          } else {
            const extraUsers: UserEntityWithSubscribersChild[] =
              await Promise.all(
                [...users].map(async (user, index) => {
                  const extraUser: UserEntityWithSubscribersParent = {
                    ...user,
                  };
                  const subToMe = (
                    await usersDL.loadMany(user.subscribedToUserIds)
                  ).map((user) => (user && 'id' in user ? user : undefined));
                  const clearSubToMe: UserEntity[] = [];
                  subToMe.forEach((item) => {
                    if (!!item) {
                      clearSubToMe.push(item);
                    }
                  });

                  const meSubTo: UserEntity[] = [];
                  allUsers.forEach((item) => {
                    if (item.subscribedToUserIds.includes(user.id)) {
                      meSubTo.push(item);
                    }
                  });

                  extraUser.subscribedToUser = clearSubToMe;
                  extraUser.userSubscribedTo = meSubTo;
                  return extraUser;
                })
              );

            const res = await Promise.all(extraUsers);
            return res;
          }
        };

        const res = await addSubs(allUsers, true);
        return res;
      },
    },
    Mutation: {
      createUser: async (_: unknown, context: any) => {
        const user: CreateUserDTO = context.user;
        console.log('-----context.user', context.user);
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
        const sub: UserEntity | undefined = await usersDL.load(subID);
        if (!sub) return null;
        addIfNotInclude(sub.subscribedToUserIds, ownID);
        const updated = await fastify.db.users.change(subID, sub);
        return updated;
      },
      unsubscribeFrom: async (_: unknown, context: any) => {
        const ownID: string = context.ownID;
        const subID: any = context.subID;
        const own: UserEntity | undefined = await usersDL.load(ownID);
        if (!own) return null;
        removeIfInclude(own.subscribedToUserIds, subID);
        const updated = await fastify.db.users.change(ownID, own);
        return updated;
      },
    },
  };
};

export default getResolvers;
