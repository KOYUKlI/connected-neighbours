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
  | 'reconcile'
  | 'reconcile-apply'
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
    'reconcile',
    'reconcile-apply',
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
    if (command === 'reconcile') {
      printReconciliation(await orchestrator.reconciliationStatus());
      return;
    }
    if (command === 'reconcile-apply') {
      const result = await orchestrator.reconcile(
        process.env.SEED_CONFIRM_RECONCILE,
      );
      printReconciliation(result.plan);
      Logger.log(
        `Réconciliation terminée; ${result.remaining.actions.length} action(s) restante(s).`,
        'DemoSeed',
      );
      return;
    }
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

function printReconciliation(
  result: Awaited<ReturnType<DemoSeedOrchestrator['reconciliationStatus']>>,
) {
  Logger.log(
    `Réconciliation dry-run: ${result.actions.length} action(s), ${result.blocked.length} blocage(s).`,
    'DemoSeed',
  );
  console.table(
    Object.entries(result.summary).map(([collection, count]) => ({
      Collection: collection,
      Nombre: count,
    })),
  );
  console.table(
    result.actions.map((action) => ({
      Collection: action.entityType,
      Identifiant: action.entityId,
      Action: action.kind,
      Raison: action.reason,
    })),
  );
  if (result.blocked.length > 0) {
    console.table(
      result.blocked.map((item) => ({
        Service: item.rootServiceId,
        Collection: item.entityType,
        Identifiant: item.entityId,
        Raison: item.reason,
      })),
    );
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
    Object.entries(result.business.counts).map(([domain, count]) => ({
      Domaine: domain,
      Nombre: count,
    })),
  );
  Logger.log(
    `MinIO: ${result.business.storage.status}; ` +
      `Neo4j: ${result.business.graph.status}.`,
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
