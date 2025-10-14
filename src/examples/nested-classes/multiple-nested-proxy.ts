import { ProxyFactory } from '../../proxy-facade';
import {
  CreateUserInput,
  ReadManyUsersInput,
  ReadOneUserInput,
  UpdateUserInput,
  User,
} from './multiple-nested-proxy-types';

export class MultipleNestedProxy {
  public static readonly DEPS = [ProxyFactory];

  constructor(private readonly proxyFactory: ProxyFactory) {}

  public async readOne(input: ReadOneUserInput): Promise<User> {
    return this.proxyFactory.execute(
      (await import('./read-one-user.command')).ReadOneUserCommand,
      input
    );
  }

  public async readAll(input: ReadManyUsersInput): Promise<User[]> {
    return this.proxyFactory.execute(
      (await import('./read-many-users.command')).ReadManyUsersCommand,
      input
    );
  }

  public async create(input: ReadManyUsersInput): Promise<User> {
    return this.proxyFactory.execute(
      (await import('./create-user.command')).CreateUserCommand,
      input
    );
  }

  public async update(input: CreateUserInput): Promise<User> {
    return this.proxyFactory.execute(
      (await import('./update-user.command')).UpdateUserCommand,
      input
    );
  }

  public async delete(input: UpdateUserInput): Promise<User> {
    return this.proxyFactory.execute(
      (await import('./delete-user.command')).DeleteUserCommand,
      input
    );
  }
}
