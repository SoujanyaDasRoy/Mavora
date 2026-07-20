import type { Metadata } from 'next'
import { ContactForm } from '@/components/ContactForm'
import { Container } from '@/components/Container'
import { PageHeader } from '@/components/PageHeader'

// Unlike the other 5 static pages, there is no content/pages/contact.mdx --
// this page's copy is hardcoded below rather than loaded via getPageBySlug --
// so its title is hardcoded here too, to match.
export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Mavora team.',
}

export default function ContactPage() {
  return (
    <main>
      <Container narrow className="pb-16">
        <PageHeader
          eyebrow="Company"
          title="Contact"
          dek="Questions, tips, or partnership ideas — send them our way."
        />
        <ContactForm />
      </Container>
    </main>
  )
}
