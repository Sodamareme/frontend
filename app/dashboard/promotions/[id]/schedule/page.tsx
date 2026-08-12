'use client'

import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CalendarOff,
  Plus,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { scheduleAPI, type ScheduleEvent } from '@/lib/api';
import { toast } from 'sonner';
import { getUserFriendlyErrorMessage } from '@/lib/error';

type EventTypeOption = 'EVENT' | 'HOLIDAY' | 'NO_CLASS';

const EVENT_TYPE_OPTIONS: Array<{
  value: EventTypeOption;
  label: string;
  description: string;
}> = [
  {
    value: 'EVENT',
    label: 'Événement',
    description: 'Information ou activité simple de la promotion.',
  },
  {
    value: 'HOLIDAY',
    label: 'Jour férié',
    description: 'Bloque le scan vigile et le scan restauration.',
  },
  {
    value: 'NO_CLASS',
    label: 'Jour sans cours',
    description: 'Bloque seulement le scan de présence vigile.',
  },
];

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTypeLabel = (type: string) => {
  return EVENT_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? 'Événement';
};

const getTypeBadgeClass = (type: string) => {
  if (type === 'HOLIDAY') {
    return 'border-red-100 bg-red-50 text-red-700';
  }

  if (type === 'NO_CLASS') {
    return 'border-amber-100 bg-amber-50 text-amber-700';
  }

  return 'border-orange-100 bg-orange-50 text-orange-700';
};

export default function SchedulePage() {
  const { id } = useParams();
  const router = useRouter();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: formatDateValue(new Date()),
    endDate: formatDateValue(new Date()),
    type: 'EVENT' as EventTypeOption,
    location: '',
  });

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError('');

      if (typeof id !== 'string') {
        throw new Error('Invalid id');
      }

      const data = await scheduleAPI.getScheduleByPromotionId(id);
      setEvents(data);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement du calendrier');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [id]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetForm = () => {
    const today = formatDateValue(new Date());
    setForm({
      title: '',
      description: '',
      startDate: today,
      endDate: today,
      type: 'EVENT',
      location: '',
    });
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (typeof id !== 'string') {
      toast.error('Promotion invalide');
      return;
    }

    if (!form.title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    if (form.endDate < form.startDate) {
      toast.error('La date de fin doit être après ou égale à la date de début');
      return;
    }

    try {
      setSubmitting(true);
      await scheduleAPI.createScheduleEvent({
        title: form.title.trim(),
        description: form.description.trim() || '',
        startDate: new Date(`${form.startDate}T00:00:00`).toISOString(),
        endDate: new Date(`${form.endDate}T23:59:59`).toISOString(),
        type: form.type,
        location: form.location.trim() || '',
        promotionId: id,
      });
      toast.success('Élément enregistré');
      resetForm();
      await fetchSchedule();
    } catch (err: any) {
      console.error(err);
      toast.error(
        getUserFriendlyErrorMessage(err, "Impossible d'enregistrer cet élément"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm('Supprimer cet élément du calendrier ?')) {
      return;
    }

    try {
      setDeletingId(eventId);
      await scheduleAPI.deleteScheduleEvent(eventId);
      toast.success('Élément supprimé');
      await fetchSchedule();
    } catch (err: any) {
      console.error(err);
      toast.error(
        getUserFriendlyErrorMessage(err, "Impossible de supprimer cet élément"),
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="p-6">Chargement du calendrier...</div>;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">Erreur</h3>
          <p className="mb-4 text-gray-500">{error}</p>
          <Link
            href={`/dashboard/promotions/${id}`}
            className="inline-flex items-center text-orange-500 hover:text-orange-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="rounded-lg p-2 transition hover:bg-gray-100"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-orange-600">
                Calendrier de la promotion
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gérez les événements, jours fériés et jours sans cours.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
          <form
            onSubmit={handleCreate}
            className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Ajouter un élément
                </h2>
                <p className="text-sm text-gray-500">
                  Les jours spéciaux appliquent automatiquement les blocages.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                >
                  {EVENT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  {
                    EVENT_TYPE_OPTIONS.find((option) => option.value === form.type)
                      ?.description
                  }
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Titre
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Ex: Tabaski, Journée pédagogique"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Début
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Fin
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Lieu
                </label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Optionnel"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Optionnel"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="mr-2 h-4 w-4" />
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>

          <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Éléments enregistrés
              </h2>
              <p className="text-sm text-gray-500">
                {events.length} élément(s) pour cette promotion
              </p>
            </div>

            {events.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-8 text-center">
                <CalendarOff className="mx-auto mb-3 h-10 w-10 text-orange-300" />
                <p className="font-medium text-gray-700">Aucun élément enregistré</p>
                <p className="mt-1 text-sm text-gray-500">
                  Ajoutez un jour férié, un jour sans cours ou un événement.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-gray-100 p-4 transition hover:border-orange-200 hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getTypeBadgeClass(event.type)}`}
                          >
                            {getTypeLabel(event.type)}
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900">
                          {event.title}
                        </h3>

                        <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-orange-500" />
                            <span>
                              {new Date(event.startDate).toLocaleDateString('fr-FR')}
                              {' '}au{' '}
                              {new Date(event.endDate).toLocaleDateString('fr-FR')}
                            </span>
                          </div>

                          {event.location ? <p>Lieu : {event.location}</p> : null}

                          {event.description ? (
                            <p className="whitespace-pre-line text-gray-500">
                              {event.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(event.id)}
                        disabled={deletingId === event.id}
                        className="inline-flex items-center justify-center rounded-xl border border-red-100 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deletingId === event.id ? 'Suppression...' : 'Supprimer'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
