import { Header, Footer } from "@/components/layout-shell";
import { ToolCard } from "@/components/shared";
import { TOOL_REGISTRY, TOOL_CATEGORIES } from "@pagelabs/shared";

export default function HomePage() {
  const allTools = Object.values(TOOL_REGISTRY);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-10">
        {/* Hero Section — Whitespace 96px above per PRD §4.2.1 */}
        <div className="pt-24 pb-8 text-left">
          <h1 className="text-5xl font-bold tracking-tight text-foreground leading-tight">
            Every PDF tool.
            <br />
            One place.
          </h1>
        </div>

        {/* Categories and Grid */}
        <div className="flex flex-col gap-16 pb-24 pt-8">
          {TOOL_CATEGORIES.map((category) => {
            const categoryTools = allTools.filter(
              (tool) => tool.category === category.id
            );

            if (categoryTools.length === 0) return null;

            return (
              <section key={category.id} className="flex flex-col gap-6">
                <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                  {category.title}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {categoryTools.map((tool) => (
                    <ToolCard
                      key={tool.slug}
                      slug={tool.slug}
                      name={tool.name}
                      description={tool.description}
                      iconName={tool.icon}
                      available={tool.available}
                      category={tool.category}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
