export const graphqlBodySchema = {
  type: 'object',
  properties: {
    mutation: { type: 'string' },
    query: { type: 'string' },
    variables: {
      type: 'object',
    },
  },
  oneOf: [
    {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string' },
        variables: {
          type: 'object',
        },
      },
      additionalProperties: false,
    },
    {
      type: 'object',
      required: ['mutation'],
      properties: {
        mutation: { type: 'string' },
        variables: {
          type: 'object',
        },
      },
      additionalProperties: false,
    },
  ],
} as const;

export const graphqlSchema = `
type UserEntity {
  id: ID
  firstName: String
  lastName: String
  email: String
  subscribedToUserIds: [String]
}
type ProfileEntity {
  id: ID
  avatar: String
  sex: String
  birthday: Int
  country: String
  street: String
  city: String
  memberTypeId: String
  userId: String
}
type PostEntity {
  id: String
  title: String
  content: String
  userId: String
}
type MemberTypeEntity {
  id: String
  discount: Int
  monthPostsLimit: Int
}
type UserEntityWithExtraData {
  id: ID
  firstName: String
  lastName: String
  email: String
  subscribedToUserIds: [String]
  posts: [PostEntity]
  profile: ProfileEntity
  memberTypes: [MemberTypeEntity]
}
type UserEntityWithProfile {
  id: ID
  firstName: String
  lastName: String
  email: String
  subscribedToUserIds: [String]
  profile: [ProfileEntity]
}
type UserEntityWithPosts {
  id: ID
  firstName: String
  lastName: String
  email: String
  subscribedToUserIds: [String]
  userSubscribedTo: [PostEntity]
}
type UserEntityWithSubscribersChild {
  id: String
  firstName: String
  lastName: String
  email: String
  subscribedToUserIds: [String]
  subscribedToUser: [UserEntity]
  userSubscribedTo: [UserEntity]
}
type UserEntityWithSubscribersParent {
  id: String
  firstName: String
  lastName: String
  email: String
  subscribedToUserIds: [String]
  subscribedToUser: [UserEntityWithSubscribersChild]
  userSubscribedTo: [UserEntityWithSubscribersChild]
}
input CreateUserDTO {
  firstName: String!
  lastName: String!
  email: String!
}
input CreateProfileDTO {
  userId: String
  avatar: String
  sex: String
  birthday: Int
  country: String
  street: String
  city: String
  memberTypeId: String
}
input CreatePostDTO {
  userId: String
  title: String
  content: String
}
input UserUpdateDTO {
  firstName: String
  lastName: String
  email: String
  subscribedToUserIds: [String]
}
input ProfileUpdateDTO {
  avatar: String
  sex: String
  birthday: Int
  country: String
  street: String
  city: String
  memberTypeId: String
  userId: String
}
input PostUpdateDTO {
  title: String
  content: String
  userId: String
}
input MemberTypeUpdateDTO {
  discount: Int
  monthPostsLimit: Int
}
type Query {
  getAllUsers: [UserEntity]
  getAllProfiles: [ProfileEntity]
  getAllPosts: [PostEntity]
  getAllMemberTypes: [MemberTypeEntity]
  getUserById(id: String): UserEntity 
  getProfileById(id: String): ProfileEntity
  getPostById(id: String): PostEntity
  geMemberTypeById(id: String): MemberTypeEntity
  getAllUsersWithExtraData: [UserEntityWithExtraData]
  getUserByIdWithExtraData(id: String): UserEntityWithExtraData 
  getAllUsersWithProfile: [UserEntityWithProfile]
  getUserByIdWithPosts(id: String): [UserEntityWithPosts]
  getAllUsersWithSubscribersUsers: [UserEntityWithSubscribersParent]
}
type Mutation {
  createUser(user: CreateUserDTO): UserEntity
  createProfile(profile: CreateProfileDTO): ProfileEntity
  createPost(post: CreatePostDTO): PostEntity
  updateUser(id: String, update: UserUpdateDTO): UserEntity
  updateProfile(id: String, update: ProfileUpdateDTO): ProfileEntity
  updatePost(id: String, update: PostUpdateDTO): PostEntity
  updateMemberType(id: String, update: MemberTypeUpdateDTO): MemberTypeEntity
  subscribeTo(ownID: String, subID: String): UserEntity
  unsubscribeFrom(ownID: String, subID: String): UserEntity
}
`;
