"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ContactPerson } from "@/lib/types";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { FormSection } from "@/components/ui/FormSection";

const emptyContact = (): ContactPerson => ({ name: "", title: "", phone: "", email: "" });

type Props = {
  initialContacts?: ContactPerson[];
};

export function SchoolContactsField({ initialContacts }: Props) {
  const [contacts, setContacts] = useState<ContactPerson[]>(
    initialContacts && initialContacts.length > 0 ? initialContacts : [emptyContact()]
  );

  const update = (index: number, field: keyof ContactPerson, value: string) =>
    setContacts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );

  const addContact = () => setContacts((prev) => [...prev, emptyContact()]);

  const removeContact = (index: number) =>
    setContacts((prev) => prev.filter((_, i) => i !== index));

  return (
    <FormSection
      title="Contacts"
      description="Who should prospective students reach out to?"
      action={
        <button
          type="button"
          onClick={addContact}
          className="inline-flex items-center gap-1 rounded-md text-sm font-semibold text-accent-ink transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Plus size={15} />
          Add contact
        </button>
      }
    >
      {contacts.map((contact, index) => (
        <div key={index} className="space-y-4 rounded-xl border border-line bg-paper/60 p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
              Contact {index + 1}
            </span>
            {contacts.length > 1 && (
              <button
                type="button"
                onClick={() => removeContact(index)}
                className="rounded-md p-1 text-muted transition-colors hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={`Remove contact ${index + 1}`}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor={`contact-${index}-name`}>
              <Input
                id={`contact-${index}-name`}
                type="text"
                name={`contacts[${index}][name]`}
                value={contact.name}
                onChange={(e) => update(index, "name", e.target.value)}
                placeholder="Jane Smith"
              />
            </Field>
            <Field label="Title / role" htmlFor={`contact-${index}-title`}>
              <Input
                id={`contact-${index}-title`}
                type="text"
                name={`contacts[${index}][title]`}
                value={contact.title}
                onChange={(e) => update(index, "title", e.target.value)}
                placeholder="Chief Flight Instructor"
              />
            </Field>
            <Field label="Phone" htmlFor={`contact-${index}-phone`}>
              <Input
                id={`contact-${index}-phone`}
                type="tel"
                name={`contacts[${index}][phone]`}
                value={contact.phone}
                onChange={(e) => update(index, "phone", e.target.value)}
                placeholder="(555) 000-0000"
              />
            </Field>
            <Field label="Email" htmlFor={`contact-${index}-email`}>
              <Input
                id={`contact-${index}-email`}
                type="email"
                name={`contacts[${index}][email]`}
                value={contact.email}
                onChange={(e) => update(index, "email", e.target.value)}
                placeholder="jane@yourschool.com"
              />
            </Field>
          </div>
        </div>
      ))}
    </FormSection>
  );
}
