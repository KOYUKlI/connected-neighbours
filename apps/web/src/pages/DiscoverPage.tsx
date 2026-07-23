import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import type { EventItem } from "../api/events";
import {
  getRecommendedEvents,
  getRecommendedNeighbors,
  getRecommendedServices,
  type RecommendedItem,
} from "../api/recommendations";
import type { PublicUserSummary, ServiceItem } from "../api/services";
import { useAuth } from "../auth/useAuth";
import { PageContainer } from "../components/layout/PageContainer";
import { Avatar } from "../components/profiles/Avatar";
import { ServiceCard } from "../components/services/ServiceCard";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingState } from "../components/ui/LoadingState";
import { Tabs } from "../components/ui/Tabs";
import { getFriendlyError } from "../utils/errors";
import { formatDate, getEntityId } from "../utils/format";

type Section = "for-you" | "services" | "events" | "neighbors";

export function DiscoverPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const initialSection = useMemo<Section>(() => {
    if (location.pathname === "/neighbors") return "neighbors";
    const value = new URLSearchParams(location.search).get("section");
    return value === "services" || value === "events" || value === "neighbors"
      ? value
      : "for-you";
  }, [location.pathname, location.search]);
  const [section, setSection] = useState<Section>(initialSection);
  const [services, setServices] = useState<Array<RecommendedItem<ServiceItem>>>(
    [],
  );
  const [events, setEvents] = useState<Array<RecommendedItem<EventItem>>>([]);
  const [neighbors, setNeighbors] = useState<
    Array<RecommendedItem<PublicUserSummary>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [serviceResponse, eventResponse, neighborResponse] =
        await Promise.all([
          getRecommendedServices({ limit: 12 }),
          getRecommendedEvents({ limit: 12 }),
          getRecommendedNeighbors({ limit: 12 }),
        ]);
      setServices(serviceResponse.items);
      setEvents(eventResponse.items);
      setNeighbors(neighborResponse.items);
    } catch (caught) {
      setError(
        getFriendlyError(
          caught,
          "Impossible de charger les suggestions locales.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function changeSection(next: Section) {
    setSection(next);
    navigate(`/discover?section=${next}`, { replace: true });
  }

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="Recherche de suggestions dans votre quartier…" />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="grid gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-700">Votre quartier</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
            À découvrir
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Des services, événements et profils publics choisis selon votre
            quartier et vos centres d’intérêt.
          </p>
        </div>
        <button
          className="min-h-11 self-start rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
          onClick={() => void load()}
          type="button"
        >
          Actualiser
        </button>
      </header>

      <Tabs
        items={[
          { id: "for-you", label: "Pour vous" },
          { id: "services", label: "Services", count: services.length },
          { id: "events", label: "Événements", count: events.length },
          { id: "neighbors", label: "Voisins", count: neighbors.length },
        ]}
        label="Suggestions locales"
        onChange={changeSection}
        value={section}
      />

      {error ? <ErrorMessage message={error} /> : null}

      {!error && section === "for-you" ? (
        services.length + events.length + neighbors.length > 0 ? (
          <div className="grid gap-8">
            {services.length > 0 ? (
              <section>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-extrabold text-slate-950">
                    Services pour vous
                  </h2>
                  <button
                    className="text-sm font-bold text-emerald-700 hover:text-emerald-900"
                    onClick={() => changeSection("services")}
                    type="button"
                  >
                    Tout voir
                  </button>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {services.slice(0, 3).map((service) => (
                    <div
                      className="grid content-start gap-2"
                      key={getEntityId(service)}
                    >
                      <Badge className="justify-self-start" tone="success">
                        {service.recommendationReason}
                      </Badge>
                      <ServiceCard
                        currentUserId={user?.id}
                        neighborhoods={[]}
                        service={service}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            <div className="grid gap-8 lg:grid-cols-2">
              {events.length > 0 ? (
                <section>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-xl font-extrabold text-slate-950">
                      Événements à venir
                    </h2>
                    <button
                      className="text-sm font-bold text-emerald-700 hover:text-emerald-900"
                      onClick={() => changeSection("events")}
                      type="button"
                    >
                      Tout voir
                    </button>
                  </div>
                  <div className="grid gap-3">
                    {events.slice(0, 2).map((event) => (
                      <EventRecommendation key={event.id} event={event} />
                    ))}
                  </div>
                </section>
              ) : null}
              {neighbors.length > 0 ? (
                <section>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-xl font-extrabold text-slate-950">
                      Voisins à découvrir
                    </h2>
                    <button
                      className="text-sm font-bold text-emerald-700 hover:text-emerald-900"
                      onClick={() => changeSection("neighbors")}
                      type="button"
                    >
                      Tout voir
                    </button>
                  </div>
                  <div className="grid gap-3">
                    {neighbors.slice(0, 3).map((neighbor) => (
                      <NeighborRecommendation
                        key={neighbor.id}
                        neighbor={neighbor}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        ) : (
          <EmptyState
            action={
              <Link
                className="font-bold text-emerald-700 hover:text-emerald-900"
                to="/neighborhood"
              >
                Choisir mon quartier
              </Link>
            }
            icon="map-pin"
            message="Confirmez votre quartier pour recevoir des suggestions locales adaptées."
            title="Aucune suggestion pour le moment"
          />
        )
      ) : null}

      {!error && section === "services" ? (
        services.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <div
                className="grid content-start gap-2"
                key={getEntityId(service)}
              >
                <Badge className="justify-self-start" tone="success">
                  {service.recommendationReason}
                </Badge>
                <ServiceCard
                  currentUserId={user?.id}
                  neighborhoods={[]}
                  service={service}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="services"
            message="Revenez après de nouvelles publications dans votre quartier."
            title="Aucun service à suggérer"
          />
        )
      ) : null}

      {!error && section === "events" ? (
        events.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => (
              <EventRecommendation key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="calendar"
            message="Aucun événement public à recommander pour le moment."
            title="Le calendrier est calme"
          />
        )
      ) : null}

      {!error && section === "neighbors" ? (
        neighbors.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {neighbors.map((neighbor) => (
              <NeighborRecommendation key={neighbor.id} neighbor={neighbor} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="users"
            message="Les profils privés ne sont jamais proposés. De nouvelles suggestions apparaîtront avec l’activité du quartier."
            title="Aucun voisin à afficher"
          />
        )
      ) : null}
    </PageContainer>
  );
}

function EventRecommendation({ event }: { event: RecommendedItem<EventItem> }) {
  return (
    <Link
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
      to={`/events/${event.id}`}
    >
      <Badge tone="info">{event.recommendationReason}</Badge>
      <h2 className="mt-3 text-lg font-extrabold text-slate-950">
        {event.title}
      </h2>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
        {event.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
        <span>
          {formatDate(event.startsAt, {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span>{event.locationLabel}</span>
      </div>
    </Link>
  );
}

function NeighborRecommendation({
  neighbor,
}: {
  neighbor: RecommendedItem<PublicUserSummary>;
}) {
  return (
    <Card className="flex items-start gap-4">
      <Avatar name={neighbor.displayName} url={neighbor.avatarUrl} />
      <div className="min-w-0 flex-1">
        <Link
          className="font-extrabold text-slate-950 hover:text-emerald-800"
          to={`/neighbors/${neighbor.id}`}
        >
          {neighbor.displayName}
        </Link>
        <p className="mt-1 text-sm text-slate-500">
          {neighbor.recommendationReason}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {neighbor.completedServicesCount} service(s) terminé(s)
        </p>
      </div>
    </Card>
  );
}
