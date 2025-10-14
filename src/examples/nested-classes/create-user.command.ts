import { Command } from '../../command';
import { Logger } from '../../logging/logger';
import { CreateUserInput, User } from './multiple-nested-proxy-types';

export class CreateUserCommand implements Command<CreateUserInput, User> {
  public static readonly DEPS = [];

  async execute(input: CreateUserInput): Promise<User> {
    Logger.info('CreateUserCommand.execute', { input });

    // Generate a new userId and return the created user
    return {
      userId: `user-${Date.now()}`,
      fullname: input.fullname,
      login: input.login,
      email: input.email,
    };
  }
}
