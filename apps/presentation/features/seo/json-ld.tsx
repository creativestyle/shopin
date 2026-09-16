export type JsonLdData = Record<string, unknown>

interface JsonLdProps {
  data: JsonLdData | JsonLdData[]
}

/**
 * Renders structured data as an inline `application/ld+json` script, the shape
 * Google's Rich Results Test and the Schema Markup Validator read.
 *
 * `<` is escaped to its unicode equivalent so a string coming from the CMS or
 * catalog can never break out of the script element (per the Next.js JSON-LD guide).
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
