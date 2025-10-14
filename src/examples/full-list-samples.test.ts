import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DIContainer } from '../container.di';
import { Logger } from '../logging/logger';
import { SimpleProxy } from './simple/simple-proxy';
import { SubClass } from './simple/simple-proxy-get-user';
import { WEAVER_REGISTRY } from '../vars';
import { ProxyFactory } from '../proxy-facade';
import { MultipleNestedProxy } from './nested-classes/multiple-nested-proxy';
import { ReadOneUserCommand } from './nested-classes/read-one-user.command';
import { ReadManyUsersCommand } from './nested-classes/read-many-users.command';
import { CreateUserCommand } from './nested-classes/create-user.command';
import { UpdateUserCommand } from './nested-classes/update-user.command';
import { DeleteUserCommand } from './nested-classes/delete-user.command';

describe('DIContainer with @Ref', () => {
  beforeEach(() => {
    // Disable Logger for tests
    vi.spyOn(Logger, 'error').mockImplementation(() => {});
    vi.spyOn(Logger, 'info').mockImplementation(() => {});
  });

  it(`
  Simple proxy facade to test the creation of a facade
  and wire it with the class implementation.
  `, async () => {
    // Initialize the container
    const container = new DIContainer();

    // Configure the container with the classes required
    container.register(WEAVER_REGISTRY, container);
    container.register(SimpleProxy);
    container.register(SubClass);

    // Get an instance of the facade instance
    const instance = container.resolve<SimpleProxy>(SimpleProxy);

    expect(instance).toBeTruthy();

    // Invoke the function from the facade
    const result = await instance.readSub('test');
    expect(result).toBe('Value from execute: test');
  });

  it(`
  Multiple nested proxy facade to test the creation of a facade
  with multiple command implementations for CRUD operations.
  `, async () => {
    // Initialize the container
    const container = new DIContainer();

    // Configure the container with the classes required
    container.register(WEAVER_REGISTRY, container);
    container.register(ProxyFactory);
    container.register(MultipleNestedProxy);
    container.register(ReadOneUserCommand);
    container.register(ReadManyUsersCommand);
    container.register(CreateUserCommand);
    container.register(UpdateUserCommand);
    container.register(DeleteUserCommand);

    // Get an instance of the facade
    const proxy = container.resolve<MultipleNestedProxy>(MultipleNestedProxy);

    expect(proxy).toBeTruthy();

    // Test readOne command
    const readOneResult = await proxy.readOne({ userId: 'user-123' });
    expect(readOneResult).toEqual({
      userId: 'user-123',
      fullname: 'John Doe',
      login: 'john.doe',
      email: 'john.doe@example.com',
    });

    // Test readAll command
    const readAllResult = await proxy.readAll({
      userId: 'user-456',
      fullname: 'Jane Smith',
    });
    expect(readAllResult).toBeInstanceOf(Array);
    expect(readAllResult.length).toBeGreaterThan(0);
    expect(readAllResult[0]).toHaveProperty('userId');
    expect(readAllResult[0]).toHaveProperty('fullname');
    expect(readAllResult[0]).toHaveProperty('login');
    expect(readAllResult[0]).toHaveProperty('email');

    // Test create command
    const createResult = await proxy.create({
      userId: 'new-user',
      fullname: 'New User',
    });
    expect(createResult).toHaveProperty('userId');
    expect(createResult).toHaveProperty('fullname');
    expect(createResult).toHaveProperty('login');
    expect(createResult).toHaveProperty('email');

    // Test update command
    const updateResult = await proxy.update({
      fullname: 'Updated User',
      login: 'updated.user',
      email: 'updated@example.com',
    });
    expect(updateResult).toHaveProperty('userId');
    expect(updateResult).toHaveProperty('fullname');
    expect(updateResult).toHaveProperty('login');
    expect(updateResult).toHaveProperty('email');

    // Test delete command
    const deleteResult = await proxy.delete({
      userId: 'user-to-delete',
      fullname: 'Delete User',
      email: 'delete@example.com',
    });
    expect(deleteResult).toHaveProperty('userId');
    expect(deleteResult).toHaveProperty('fullname');
    expect(deleteResult).toHaveProperty('login');
    expect(deleteResult).toHaveProperty('email');
  });

  it(`
  Multiple nested proxy - register only one command,
  verify it executes successfully while others fail.
  `, async () => {
    // Initialize the container
    const container = new DIContainer();

    // Configure the container with minimal registration
    container.register(WEAVER_REGISTRY, container);
    container.register(ProxyFactory);
    container.register(MultipleNestedProxy);
    // Only register ReadOneUserCommand
    container.register(ReadOneUserCommand);

    // Get an instance of the facade
    const proxy = container.resolve<MultipleNestedProxy>(MultipleNestedProxy);

    expect(proxy).toBeTruthy();

    // Test readOne command - should succeed
    const readOneResult = await proxy.readOne({ userId: 'user-123' });
    expect(readOneResult).toEqual({
      userId: 'user-123',
      fullname: 'John Doe',
      login: 'john.doe',
      email: 'john.doe@example.com',
    });

    // Test readAll command - should fail (not registered)
    await expect(
      proxy.readAll({
        userId: 'user-456',
        fullname: 'Jane Smith',
      })
    ).rejects.toThrow();

    // Test create command - should fail (not registered)
    await expect(
      proxy.create({
        userId: 'new-user',
        fullname: 'New User',
      })
    ).rejects.toThrow();

    // Test update command - should fail (not registered)
    await expect(
      proxy.update({
        fullname: 'Updated User',
        login: 'updated.user',
        email: 'updated@example.com',
      })
    ).rejects.toThrow();

    // Test delete command - should fail (not registered)
    await expect(
      proxy.delete({
        userId: 'user-to-delete',
        fullname: 'Delete User',
        email: 'delete@example.com',
      })
    ).rejects.toThrow();
  });

  it(`
  Multiple nested proxy - partial registration,
  verify registered commands succeed and unregistered ones fail.
  `, async () => {
    // Initialize the container
    const container = new DIContainer();

    // Configure the container with partial registration
    container.register(WEAVER_REGISTRY, container);
    container.register(ProxyFactory);
    container.register(MultipleNestedProxy);
    // Register only ReadOneUserCommand and CreateUserCommand
    container.register(ReadOneUserCommand);
    container.register(CreateUserCommand);

    // Get an instance of the facade
    const proxy = container.resolve<MultipleNestedProxy>(MultipleNestedProxy);

    expect(proxy).toBeTruthy();

    // Test readOne command - should succeed
    const readOneResult = await proxy.readOne({ userId: 'user-789' });
    expect(readOneResult).toEqual({
      userId: 'user-789',
      fullname: 'John Doe',
      login: 'john.doe',
      email: 'john.doe@example.com',
    });

    // Test create command - should succeed
    const createResult = await proxy.create({
      userId: 'new-user',
      fullname: 'New User',
    });
    expect(createResult).toHaveProperty('userId');
    expect(createResult.userId).toMatch(/^user-\d+$/);
    expect(createResult).toHaveProperty('fullname');
    expect(createResult).toHaveProperty('login');
    expect(createResult).toHaveProperty('email');

    // Test readAll command - should fail (not registered)
    await expect(
      proxy.readAll({
        userId: 'user-456',
        fullname: 'Jane Smith',
      })
    ).rejects.toThrow();

    // Test update command - should fail (not registered)
    await expect(
      proxy.update({
        fullname: 'Updated User',
        login: 'updated.user',
        email: 'updated@example.com',
      })
    ).rejects.toThrow();

    // Test delete command - should fail (not registered)
    await expect(
      proxy.delete({
        userId: 'user-to-delete',
        fullname: 'Delete User',
        email: 'delete@example.com',
      })
    ).rejects.toThrow();
  });
});
