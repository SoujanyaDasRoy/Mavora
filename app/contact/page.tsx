import { ContactForm } from '@/components/ContactForm'

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-[720px] px-6 py-10">
      <h1 className="text-3xl font-extrabold mb-6">Contact</h1>
      <ContactForm />
    </main>
  )
}
