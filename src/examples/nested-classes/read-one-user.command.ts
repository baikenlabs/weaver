import { Command } from '../../command';
import { Logger } from '../../logging/logger';
import { ReadOneUserInput, User } from './multiple-nested-proxy-types';

export class ReadOneUserCommand implements Command<ReadOneUserInput, User> {
  public static readonly DEPS = [];

  async execute(input: ReadOneUserInput): Promise<User> {
    Logger.info('ReadOneUserCommand.execute', { input });

    // Mock user data for demonstration
    return {
      userId: input.userId,
      fullname: 'John Doe',
      login: 'john.doe',
      email: 'john.doe@example.com',
    };
  }
}
