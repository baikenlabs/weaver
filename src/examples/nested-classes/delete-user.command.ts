import { Command } from '../../command';
import { Logger } from '../../logging/logger';
import { RemoveUserInput, User } from './multiple-nested-proxy-types';

export class DeleteUserCommand implements Command<RemoveUserInput, User> {
  public static readonly DEPS = [];

  async execute(input: RemoveUserInput): Promise<User> {
    Logger.info('DeleteUserCommand.execute', { input });

    // Return the deleted user information
    return {
      userId: 'deleted-user-id',
      fullname: input.fullname,
      login: input.login,
      email: input.email,
    };
  }
}
