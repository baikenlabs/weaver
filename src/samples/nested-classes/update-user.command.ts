import { Command } from '../../command';
import { Logger } from '../../logging/logger';
import { UpdateUserInput, User } from './multiple-nested-proxy-types';

export class UpdateUserCommand implements Command<UpdateUserInput, User> {
  public static readonly DEPS = [];

  async execute(input: UpdateUserInput): Promise<User> {
    Logger.info('UpdateUserCommand.execute', { input });

    // Return the updated user
    return {
      userId: input.userId,
      fullname: input.fullname,
      login: 'johndoe', // login is omitted from UpdateUserInput, so we use a default
      email: input.email,
    };
  }
}
