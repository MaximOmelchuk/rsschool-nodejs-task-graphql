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
  getUserByIdWithExtraData: UserEntityWithExtraData
  getAllUsersWithProfile: [UserEntityWithProfile]
  getUserByIdWithPosts(id: String): [UserEntityWithPosts]
}
`;
