import type { Metadata } from 'next'
import { ContactForm } from '@/components/ContactForm'

// Unlike the other 5 static pages, there is no content/pages/contact.mdx --
// this page's copy is hardcoded below rather than loaded via getPageBySlug --
// so its title is hardcoded here too, to match.
export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Mavora team.',
}

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-[720px] px-6 py-10">
      <h1 className="text-3xl font-extrabold mb-6">Contact</h1>
      <ContactForm />
    </main>
  )
}
