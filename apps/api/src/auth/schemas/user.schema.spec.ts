import {
  IdentityMigrationStatus,
  IdentityProvider,
  UserSchema,
} from './user.schema';

describe('User identity schema', () => {
  it('keeps local credentials optional and private', () => {
    const passwordPath = UserSchema.path('passwordHash');

    expect(passwordPath.options.required).toBeUndefined();
    expect(passwordPath.options.select).toBe(false);
    expect(passwordPath.options.default).toBeNull();
  });

  it('defines safe defaults for local and Keycloak identities', () => {
    expect(UserSchema.path('identityProvider').options.default).toBe(
      IdentityProvider.LOCAL,
    );
    expect(UserSchema.path('identityMigrationStatus').options.default).toBe(
      IdentityMigrationStatus.LOCAL_ONLY,
    );
    expect(UserSchema.path('emailVerified').options.default).toBe(false);
  });

  it('enforces one non-null Keycloak subject per user', () => {
    const subjectIndex = UserSchema.indexes().find(
      ([fields]) => fields.keycloakSubject === 1,
    );

    expect(subjectIndex).toBeDefined();
    expect(subjectIndex?.[1]).toMatchObject({
      unique: true,
      partialFilterExpression: {
        keycloakSubject: { $type: 'string' },
      },
    });
  });
});
