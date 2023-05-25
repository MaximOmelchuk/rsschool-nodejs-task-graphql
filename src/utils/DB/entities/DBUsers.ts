import { PostEntity } from './DBPosts';
import { MemberTypeEntity } from './DBMemberTypes';
import { ProfileEntity } from './DBProfiles';
import * as crypto from 'node:crypto';
import DBEntity from './DBEntity';

export type UserEntity = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subscribedToUserIds: string[];
};
export type UserEntityWithExtraData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subscribedToUserIds: string[];
  posts?: PostEntity[];
  profile?: ProfileEntity | null;
  memberTypes?: MemberTypeEntity[];
};
export type UserEntityWithProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subscribedToUserIds: string[];
  userSubscribedTo?: ProfileEntity[];
};
export type UserEntityWithPosts = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subscribedToUserIds: string[];
  subscribedToUser?: PostEntity[];
};
type CreateUserDTO = Omit<UserEntity, 'id' | 'subscribedToUserIds'>;
type ChangeUserDTO = Partial<Omit<UserEntity, 'id'>>;

export default class DBUsers extends DBEntity<
  UserEntity,
  ChangeUserDTO,
  CreateUserDTO
> {
  async create(dto: CreateUserDTO) {
    const created: UserEntity = {
      ...dto,
      subscribedToUserIds: [],
      id: crypto.randomUUID(),
    };
    this.entities.push(created);
    return created;
  }
}
