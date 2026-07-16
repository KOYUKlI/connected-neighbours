import { useAuth } from '../../auth/useAuth';
import { EmptyState } from '../../shared/components/EmptyState';
import { getEntityId } from '../../shared/utils/entities';
import { CreateServicePanel } from './components/CreateServicePanel';
import { ServiceCard } from './components/ServiceCard';
import { useServicesWorkflow } from './hooks/useServicesWorkflow';

export function ServicesPage() {
  const { currentUser } = useAuth();
  const {
    services,
    myApplications,
    receivedApplications,
    isLoading,
    actionPending,
    error,
    notice,
    onAcceptApplication,
    onCancelService,
    onCreateApplication,
    onCreateService,
    onGenerateContract,
    onPublishService,
    onRejectApplication,
  } = useServicesWorkflow();

  if (isLoading) {
    return <div className="loading-panel">Chargement...</div>;
  }

  return (
    <div className="stack">
      {notice ? <div className="success-banner">{notice}</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}

      <div className="two-column-layout">
        <CreateServicePanel
          currentUser={currentUser}
          isPending={actionPending === 'create-service'}
          onCreate={onCreateService}
        />

        <div className="stack">
          {services.length === 0 ? (
            <EmptyState message="Aucun service disponible." />
          ) : (
            services.map((service) => {
              const serviceId = getEntityId(service);
              const myApplication = myApplications.find(
                (application) => application.serviceId === serviceId,
              );

              return (
                <ServiceCard
                  actionPending={actionPending}
                  currentUser={currentUser}
                  key={serviceId}
                  myApplication={myApplication}
                  onAcceptApplication={onAcceptApplication}
                  onApply={onCreateApplication}
                  onCancelService={onCancelService}
                  onGenerateContract={onGenerateContract}
                  onPublishService={onPublishService}
                  onRejectApplication={onRejectApplication}
                  receivedApplications={receivedApplications[serviceId] ?? []}
                  service={service}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
