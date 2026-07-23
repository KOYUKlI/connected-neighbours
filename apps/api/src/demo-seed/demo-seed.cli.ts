import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import {
  DemoSeedOrchestrator,
  DemoSeedScope,
} from './demo-seed-orchestrator.service';

type DemoSeedCommand =
  | 'run'
  | 'status'
  | 'reset'
  | 'mongodb'
  | 'keycloak'
  | 'minio'
  | 'graph';

async function main() {
  process.env.DEV_AUTH_SEED = 'false';
  const command = (process.argv[2] ?? 'run') as DemoSeedCommand;
  const allowed: DemoSeedCommand[] = [
    'run',
    'status',
    'reset',
    'mongodb',
    'keycloak',
    'minio',
    'graph',
  ];
  if (!allowed.includes(command)) {
    throw new Error(`Commande de seed inconnue: ${command}`);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const orchestrator = app.get(DemoSeedOrchestrator);
    const result =
      command === 'status'
        ? await orchestrator.status()
        : command === 'reset'
          ? await orchestrator.reset(process.env.SEED_CONFIRM_RESET)
          : await orchestrator.run(
              command === 'run' ? 'all' : (command as DemoSeedScope),
            );
    printSummary(result);
  } finally {
    await app.close();
  }
}

function printSummary(
  result: Awaited<ReturnType<DemoSeedOrchestrator['status']>>,
) {
  Logger.log(
    `MongoDB: ${result.mongodb.users} comptes de démonstration; ` +
      `Keycloak: ${result.keycloak.enabled ? result.keycloak.identities : 'désactivé'}.`,
    'DemoSeed',
  );
  console.table(
    result.accounts.map((account) => ({
      Compte: account.displayName,
      Email: account.email,
      Rôle: account.role,
      Local: account.localLogin ? 'oui' : 'non',
      Keycloak: account.keycloakLogin ? 'oui' : 'non',
      Lié: account.linked ? 'oui' : 'non',
      'E-mail vérifié': account.emailVerified ? 'oui' : 'non',
      MFA: account.mfaInitialAction
        ? 'configuration au premier login'
        : 'facultatif',
      'Variable du mot de passe': account.passwordVariable ?? 'aucune',
    })),
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Erreur inconnue';
  Logger.error(message, undefined, 'DemoSeed');
  process.exitCode = 1;
});
