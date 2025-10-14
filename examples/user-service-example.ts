import { DIContainer } from '../src/container.di';
import { ProxyFactory } from '../src/proxy-facade';
import { Command } from '../src/command';
import { WEAVER_REGISTRY } from '../src/vars';

// Define types for our user domain
interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserInput {
  name: string;
  email: string;
}

interface UpdateUserInput {
  id: string;
  name?: string;
  email?: string;
}

// Command implementations
class GetUserCommand implements Command<string, User> {
  static readonly DEPS = [];

  async execute(userId: string): Promise<User> {
    // In a real application, this would fetch from a database
    console.log(`Fetching user with ID: ${userId}`);
    return {
      id: userId,
      name: 'John Doe',
      email: 'john.doe@example.com',
    };
  }
}

class CreateUserCommand implements Command<CreateUserInput, User> {
  static readonly DEPS = [];

  async execute(input: CreateUserInput): Promise<User> {
    // In a real application, this would save to a database
    console.log(`Creating user:`, input);
    return {
      id: `user-${Date.now()}`,
      name: input.name,
      email: input.email,
    };
  }
}

class UpdateUserCommand implements Command<UpdateUserInput, User> {
  static readonly DEPS = [];

  async execute(input: UpdateUserInput): Promise<User> {
    // In a real application, this would update the database
    console.log(`Updating user:`, input);
    return {
      id: input.id,
      name: input.name || 'Updated Name',
      email: input.email || 'updated@example.com',
    };
  }
}

class DeleteUserCommand implements Command<string, boolean> {
  static readonly DEPS = [];

  async execute(userId: string): Promise<boolean> {
    // In a real application, this would delete from database
    console.log(`Deleting user with ID: ${userId}`);
    return true;
  }
}

// Facade class that uses ProxyFactory
class UserService {
  static readonly DEPS = [ProxyFactory];

  constructor(private readonly proxyFactory: ProxyFactory) {}

  async getUser(userId: string): Promise<User> {
    return this.proxyFactory.execute(
      (await import('./user-service-example')).GetUserCommand,
      userId
    );
  }

  async createUser(input: CreateUserInput): Promise<User> {
    return this.proxyFactory.execute(
      (await import('./user-service-example')).CreateUserCommand,
      input
    );
  }

  async updateUser(input: UpdateUserInput): Promise<User> {
    return this.proxyFactory.execute(
      (await import('./user-service-example')).UpdateUserCommand,
      input
    );
  }

  async deleteUser(userId: string): Promise<boolean> {
    return this.proxyFactory.execute(
      (await import('./user-service-example')).DeleteUserCommand,
      userId
    );
  }
}

// Export commands for the dynamic imports
export { GetUserCommand, CreateUserCommand, UpdateUserCommand, DeleteUserCommand };

// Example usage
async function main() {
  // Initialize the DI container
  const container = new DIContainer();

  // Register services
  container.register(WEAVER_REGISTRY, container);
  container.register(ProxyFactory);
  container.register(UserService);

  // Register all command implementations
  container.register(GetUserCommand);
  container.register(CreateUserCommand);
  container.register(UpdateUserCommand);
  container.register(DeleteUserCommand);

  // Resolve the UserService
  const userService = container.resolve<UserService>(UserService);

  // Use the service
  console.log('=== Creating a new user ===');
  const newUser = await userService.createUser({
    name: 'Alice Johnson',
    email: 'alice@example.com',
  });
  console.log('Created user:', newUser);

  console.log('\n=== Getting user by ID ===');
  const user = await userService.getUser('user-123');
  console.log('Retrieved user:', user);

  console.log('\n=== Updating user ===');
  const updatedUser = await userService.updateUser({
    id: 'user-123',
    name: 'Alice Smith',
    email: 'alice.smith@example.com',
  });
  console.log('Updated user:', updatedUser);

  console.log('\n=== Deleting user ===');
  const deleted = await userService.deleteUser('user-123');
  console.log('User deleted:', deleted);
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { UserService };