import ldClient from 'ldclient-js';
import adapter, { camelCaseFlags, createAnonymousUserKey } from './adapter';

jest.mock('nanoid', () => jest.fn(() => 'foo-random-id'));

const clientSideId = '123-abc';
const user = { key: 'foo-user' };
const flags = { 'some-flag-1': true, 'some-flag-2': false };

jest.mock('ldclient-js', () => ({
  initialize: jest.fn(() => ({
    on: jest.fn((_, cb) => cb()),
    allFlags: jest.fn(() => ({})),
  })),
}));

describe('when configuring', () => {
  let onStatusStateChange;
  let onFlagsStateChange;

  beforeEach(() => {
    onStatusStateChange = jest.fn();
    onFlagsStateChange = jest.fn();
  });

  describe('with user key', () => {
    beforeEach(() => {
      return adapter.configure({
        clientSideId,
        onStatusStateChange,
        onFlagsStateChange,
        ...user,
      });
    });

    it('should initialize the `ld-client` with `clientSideId` and given `user`', () => {
      expect(ldClient.initialize).toHaveBeenCalledWith(clientSideId, user);
    });
  });

  describe('without key', () => {
    beforeEach(() =>
      adapter.configure({
        clientSideId,
        onStatusStateChange,
        onFlagsStateChange,
        ...{
          group: 'foo-group',
        },
      })
    );

    it('should initialize the `ld-client` with `clientSideId` and random `user` `key`', () => {
      expect(ldClient.initialize).toHaveBeenCalledWith(clientSideId, {
        key: 'foo-random-id',
        group: 'foo-group',
      });
    });
  });

  describe('when reconfiguring before configured', () => {
    it('should reject reconfiguration', () => {
      return expect(adapter.reconfigure({ user })).rejects.toEqual(
        expect.any(Error)
      );
    });
  });

  describe('when ready', () => {
    let client;
    let onStatusStateChange;
    let onFlagsStateChange;

    beforeEach(() => {
      onStatusStateChange = jest.fn();
      onFlagsStateChange = jest.fn();
      client = {
        on: jest.fn((_, cb) => cb()),
        allFlags: jest.fn(() => flags),
      };

      ldClient.initialize.mockReturnValue(client);

      return adapter.configure({
        clientSideId,
        onStatusStateChange,
        onFlagsStateChange,
        ...user,
      });
    });

    describe('when `ldClient` is ready', () => {
      it('should `dispatch` `onUpdateStatus` action with `isReady`', () => {
        expect(onStatusStateChange).toHaveBeenCalledWith({
          isReady: true,
        });
      });

      it('should `dispatch` `onStatusStateChange`', () => {
        expect(onFlagsStateChange).toHaveBeenCalledWith({
          someFlag1: true,
          someFlag2: false,
        });
      });

      it('should register callbacks to receive flag updates', () => {
        expect(client.on).toHaveBeenCalledWith(
          `change:some-flag-1`,
          expect.any(Function)
        );

        expect(client.on).toHaveBeenCalledWith(
          `change:some-flag-2`,
          expect.any(Function)
        );
      });
    });

    describe('with flag updates', () => {
      beforeEach(() => {
        // Reset due to preivous dispatches
        onFlagsStateChange.mockClear();

        // Checking for change:* callbacks and settings all flags to false.
        client.on.mock.calls.forEach(([event, cb]) => {
          if (event.startsWith('change:')) cb(false);
        });
      });

      it('should `dispatch` `onFlagsStateChange` action', () => {
        expect(onFlagsStateChange).toHaveBeenCalled();
      });

      it('should `dispatch` `onFlagsStateChange` action with camel cased `flags`', () => {
        expect(onFlagsStateChange).toHaveBeenCalledWith({
          someFlag1: false,
        });
        expect(onFlagsStateChange).toHaveBeenCalledWith({
          someFlag2: false,
        });
      });
    });

    describe('when reconfiguring', () => {
      const nextUser = { key: 'bar-user' };
      let client;

      beforeEach(() => {
        client = {
          identify: jest.fn(),
          on: jest.fn((_, cb) => cb()),
          allFlags: jest.fn(() => ({})),
        };

        ldClient.initialize.mockReturnValue(client);

        return adapter
          .configure({
            clientSideId,
            onStatusStateChange,
            onFlagsStateChange,
            ...user,
          })
          .then(() => adapter.reconfigure(nextUser));
      });

      it('should invoke `identify` on the `client` with the `user`', () => {
        expect(client.identify).toHaveBeenCalledWith(nextUser);
      });
    });
  });
});

describe('camelCasedFlags', () => {
  describe('with dashes', () => {
    const rawFlags = {
      'a-flag': true,
      'flag-b-c': false,
    };

    it('should camel case to uppercased flag names', () => {
      expect(camelCaseFlags(rawFlags)).toEqual({ aFlag: true, flagBC: false });
    });
  });

  describe('with spaces', () => {
    const rawFlags = {
      'a flag': true,
      'flag b-c': false,
    };

    it('should camel case to uppercased flag names', () => {
      expect(camelCaseFlags(rawFlags)).toEqual({ aFlag: true, flagBC: false });
    });
  });
});

describe('create anonymous user', () => {
  it('should create user with uuid in key property', () => {
    expect(createAnonymousUserKey()).toBeDefined();
  });

  it('should create uuid of length `foo-random-id`', () => {
    expect(createAnonymousUserKey().length).toBe(13);
  });
});
