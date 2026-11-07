import Link from "next/link";
import { TOOL_REGISTRY } from "@pagelabs/shared";
import { getToolCopy, getToolFaqs } from "@/lib/tool-seo";

interface ToolSeoSectionProps {
  slug: string;
}

/**
 * Server-rendered explainer + FAQ shown below every tool workspace.
 *
 * It exists for two reasons: real users landing from search need to know how a
 * tool works before they trust it with a document, and crawlers need indexable
 * page copy. It follows the PageLabs design language: flat surfaces, 1px
 * borders, generous radii, no shadows.
 */
export function ToolSeoSection({ slug }: ToolSeoSectionProps) {
  const tool = TOOL_REGISTRY[slug];
  if (!tool) return null;

  const copy = getToolCopy(slug);
  const faqs = getToolFaqs(slug);

  return (
    <section
      aria-labelledby="tool-guide-heading"
      className="w-full border-t border-border bg-background"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* How to use */}
          <div>
            <h2
              id="tool-guide-heading"
              className="text-2xl font-semibold tracking-tight text-foreground"
            >
              How to use {tool.name}
            </h2>
            <p className="mt-3 text-base font-medium leading-relaxed text-muted-foreground">
              {copy.intro}
            </p>
            <ol className="mt-8 flex flex-col gap-4">
              {copy.steps.map((step, index) => (
                <li key={step} className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold text-foreground"
                  >
                    {index + 1}
                  </span>
                  <span className="text-base font-medium leading-relaxed text-foreground">
                    {step}
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-8 rounded-3xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">
                Private by default
              </h3>
              <p className="mt-2 text-base font-medium leading-relaxed text-muted-foreground">
                PageLabs sets no tracking cookies and shows no ads. Your upload is
                processed in an isolated worker, generated files are purged on a
                schedule, and everything is shredded within two hours.
              </p>
              <p className="mt-3 text-sm font-semibold text-muted-foreground">
                Open source under the MIT license —{" "}
                <Link
                  href="https://github.com/tanbopp/pagelabs-pdf-tools"
                  className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
                >
                  read the code
                </Link>
                .
              </p>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {tool.name} FAQ
            </h2>
            <dl className="mt-8 flex flex-col gap-6">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-3xl border border-border bg-card p-6"
                >
                  <dt className="text-base font-semibold text-foreground">
                    {faq.question}
                  </dt>
                  <dd className="mt-2 text-base font-medium leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-8 text-base font-medium text-muted-foreground">
              Looking for something else?{" "}
              <Link
                href="/"
                className="font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
              >
                Browse all 30+ PDF tools
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
