import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getDiscoverEvents,
  respondToEvent,
  type EventItem,
  type EventResponseStatus,
} from "../../api/events";
import { PageContainer } from "../../components/layout/PageContainer";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { buttonStyles } from "../../components/ui/buttonStyles";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { Icon } from "../../components/ui/Icon";
import { LoadingState } from "../../components/ui/LoadingState";
import { getFriendlyError } from "../../utils/errors";
import { formatDate } from "../../utils/format";
import { eventCategoryLabels } from "./localLifePresentation";

export function EventDiscoverPage() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDiscoverEvents();
      setItems(result.items);
      setIndex(0);
    } catch (caught) {
      setError(
        getFriendlyError(caught, "Impossible de charger la découverte."),
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const current = items[index];
  async function respond(response: EventResponseStatus) {
    if (!current) return;
    if (
      response === "going" &&
      !window.confirm(
        current.isFull
          ? "Cet événement est complet. Rejoindre la liste d’attente ?"
          : "Confirmer votre participation ?",
      )
    )
      return;
    setPending(true);
    setError(null);
    try {
      await respondToEvent(current.id, response);
      setIndex((value) => value + 1);
    } catch (caught) {
      setError(
        getFriendlyError(
          caught,
          "Cet événement a changé. Rechargez la découverte.",
        ),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <PageContainer className="grid max-w-4xl gap-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-slate-600 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
          to="/events"
        >
          <Icon className="size-4" name="arrow-left" /> Liste des événements
        </Link>
        {items.length ? (
          <span className="text-sm font-semibold text-slate-500">
            {Math.min(index + 1, items.length)} / {items.length}
          </span>
        ) : null}
      </div>
      <header>
        <p className="text-sm font-bold text-emerald-700">
          Sélection de votre quartier
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950 sm:text-3xl">
          Découvrir un événement
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Cette sélection repose sur les dates, la popularité et votre quartier.
          Les boutons restent le moyen principal d’agir.
        </p>
      </header>
      {error ? <ErrorMessage message={error} /> : null}
      {loading ? (
        <LoadingState message="Préparation de votre sélection…" />
      ) : null}
      {!loading && !current ? (
        <EmptyState
          icon="calendar"
          message="Vous avez parcouru les événements disponibles ou déjà répondu à chacun."
          title="Vous êtes à jour"
        />
      ) : null}
      {!loading && current ? (
        <Card className="overflow-hidden p-0">
          <div className="grid min-h-44 place-items-center bg-emerald-100 px-6 text-center">
            <div>
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-white text-emerald-800 shadow-sm">
                <Icon
                  className="size-8"
                  name={
                    current.category === "sport"
                      ? "activity"
                      : current.category === "help"
                        ? "users"
                        : "calendar"
                  }
                />
              </span>
              <Badge className="mt-4" tone="info">
                {eventCategoryLabels[current.category]}
              </Badge>
            </div>
          </div>
          <div className="grid gap-5 p-5 sm:p-7">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-950">
                {current.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {current.description}
              </p>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-bold text-slate-500">Quand</dt>
                <dd className="mt-1 text-slate-900">
                  {formatDate(current.startsAt, {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500">Où</dt>
                <dd className="mt-1 text-slate-900">{current.locationLabel}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500">Organisateur</dt>
                <dd className="mt-1 text-slate-900">
                  {current.organizer?.displayName ?? "Un voisin"}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500">Places</dt>
                <dd className="mt-1 text-slate-900">
                  {current.counts.remainingPlaces === null
                    ? "Sans limite annoncée"
                    : current.counts.remainingPlaces > 0
                      ? `${current.counts.remainingPlaces} restante(s)`
                      : "Liste d’attente ouverte"}
                </dd>
              </div>
            </dl>
            <div className="grid gap-2 border-t border-slate-100 pt-5 sm:grid-cols-4">
              <Button
                disabled={pending}
                onClick={() => setIndex((value) => value + 1)}
                variant="ghost"
              >
                Passer
              </Button>
              <Button
                disabled={pending || !current.permissions.canRespond}
                onClick={() => respond("interested")}
                variant="secondary"
              >
                Intéressé
              </Button>
              <Button
                disabled={pending || !current.permissions.canRespond}
                onClick={() => respond("maybe")}
                variant="secondary"
              >
                Peut-être
              </Button>
              <Button
                disabled={pending || !current.permissions.canJoin}
                onClick={() => respond("going")}
                variant="primary"
              >
                Participer
              </Button>
            </div>
            <Link
              className={buttonStyles("ghost", "sm", "justify-self-center")}
              to={`/events/${current.id}`}
            >
              Voir tous les détails
            </Link>
          </div>
        </Card>
      ) : null}
      {!loading && !current ? (
        <div className="flex justify-center">
          <Button onClick={load} variant="secondary">
            <Icon className="size-4" name="refresh" /> Recharger
          </Button>
        </div>
      ) : null}
    </PageContainer>
  );
}
