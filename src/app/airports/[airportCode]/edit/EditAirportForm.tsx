"use client";

import { useActionState } from "react";
import type { Airport } from "@/lib/types";
import { updateAirport } from "@/app/actions/airports";
import { useActionToast } from "@/components/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormSection } from "@/components/ui/FormSection";
import { Input, Textarea } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";

type Props = {
  airport: Airport;
  cityName: string;
  stateName: string;
};

export function EditAirportForm({ airport, cityName, stateName }: Props) {
  const [state, action, pending] = useActionState(updateAirport, {});
  useActionToast(state, { errorTitle: "Couldn't save airport" });
  const backHref = `/airports/${airport.icao.toLowerCase()}`;

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="airportId" value={airport.id} />

      {/* Identifiers */}
      <FormSection
        title="Airport identifiers"
        description="ICAO is the canonical URL slug and can't be changed here. IATA and FAA LID are optional alternates."
      >
        <Field label="Airport name" htmlFor="name" required>
          <Input id="name" name="name" type="text" required defaultValue={airport.name} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="ICAO code" htmlFor="icao" hint="4-letter code">
            <Input
              id="icao"
              type="text"
              disabled
              defaultValue={airport.icao}
              maxLength={4}
              className="font-mono uppercase"
            />
          </Field>
          <Field label="IATA code" htmlFor="iata" hint="3-letter code">
            <Input
              id="iata"
              name="iata"
              type="text"
              defaultValue={airport.iata ?? ""}
              maxLength={3}
              className="font-mono uppercase"
            />
          </Field>
          <Field label="FAA LID" htmlFor="faaLid" hint="Local identifier">
            <Input
              id="faaLid"
              name="faaLid"
              type="text"
              defaultValue={airport.faaLid ?? ""}
              maxLength={5}
              className="font-mono uppercase"
            />
          </Field>
        </div>
      </FormSection>

      {/* Location — read-only: derived from catalog records */}
      <FormSection title="Location">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="City" htmlFor="city">
            <Input id="city" type="text" disabled defaultValue={cityName} />
          </Field>
          <Field label="State" htmlFor="state">
            <Input id="state" type="text" disabled defaultValue={stateName} />
          </Field>
        </div>
      </FormSection>

      {/* Description */}
      <FormSection
        title="Description"
        description="Shown on the airport detail page. A brief overview of the airport, its history, or what makes it notable for flight training."
      >
        <Textarea
          id="description"
          name="description"
          aria-label="Description"
          rows={5}
          defaultValue={airport.description ?? ""}
          placeholder="e.g. Falcon Field Airport is a public general aviation airport located in Mesa, Arizona…"
        />
      </FormSection>

      {state.error && <Notice tone="error">{state.error}</Notice>}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" size="lg" disabled={pending} className="sm:flex-1">
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button href={backHref} variant="secondary" size="lg" className="sm:flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}
