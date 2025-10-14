export interface User {
  userId: string;
  fullname: string;
  login: string;
  email: string;
}

export interface ReadOneUserInput extends Pick<User, 'userId'> {}
export interface ReadManyUsersInput extends Pick<User, 'userId' | 'fullname'> {}
export interface CreateUserInput extends Omit<User, 'userId'> {}
export interface UpdateUserInput extends Omit<User, 'login'> {}
export interface RemoveUserInput extends Omit<User, 'userId'> {}
