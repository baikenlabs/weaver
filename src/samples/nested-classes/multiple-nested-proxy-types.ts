export interface User {
  userId: string;
  fullname: string;
  login: string;
  email: string;
}

export type ReadOneUserInput = Pick<User, 'userId'>;
export type ReadManyUsersInput = Pick<User, 'userId' | 'fullname'>;
export type CreateUserInput = Omit<User, 'userId'>;
export type UpdateUserInput = Omit<User, 'login'>;
export type RemoveUserInput = Omit<User, 'userId'>;
