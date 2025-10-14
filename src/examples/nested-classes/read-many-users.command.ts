import { Command } from '../../command';
import { Logger } from '../../logging/logger';
import { ReadManyUsersInput, User } from './multiple-nested-proxy-types';

export class ReadManyUsersCommand
  implements Command<ReadManyUsersInput, User[]>
{
  public static readonly DEPS = [];

  async execute(input: ReadManyUsersInput): Promise<User[]> {
    Logger.info('ReadManyUsersCommand.execute', { input });

    // Mock user data for demonstration
    return [
      {
        userId: input.userId,
        fullname: input.fullname,
        login: 'johndoe',
        email: 'john.doe@example.com',
      },
      {
        userId: '2',
        fullname: 'Jane Smith',
        login: 'janesmith',
        email: 'jane.smith@example.com',
      },
    ];
  }
}
