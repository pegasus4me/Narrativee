export default function Home() {
  return (
    <div className="shell" id="top">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="safoan.inc home">
          safoan.inc
        </a>
        <nav aria-label="Main navigation">
          <a href="#projects">Projects</a>
          <a href="#pegasus">The lab</a>
        </nav>
      </header>

      <main id="main">
        <section
          className="projects section"
          id="projects"
          aria-labelledby="projects-title"
        >
          <div className="section-heading">
            <h2 className="eyebrow" id="projects-title">
              The first chapter
            </h2>
            <span className="section-note">01 product. Full focus.</span>
          </div>
          <article className="project" aria-labelledby="narrativee-title">
            <div className="project-top">
              <span className="project-category">AI × Brand design</span>
              <span className="status">
                <span aria-hidden="true" />
                In development
              </span>
            </div>
            <div className="project-body">
              <div>
                <h3 id="narrativee-title">
                  Narrativee<span aria-hidden="true">.</span>
                </h3>
                <p className="project-tagline">
                  Your brand. A creative partner.
                </p>
              </div>
              <div className="project-details">
                <p>
                  An AI brand designer for social posts and ads. Bring your
                  brand, your references, and an idea. Shape the creative in a
                  shared workspace.
                </p>
                <a
                  className="project-link"
                  href="https://narrativee.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Discover Narrativee <span aria-hidden="true">↗</span>
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </div>
            </div>
          </article>
          <p className="project-footnote">
            The first product under Pegasus. My entire focus today.
          </p>
        </section>

        <section
          className="lab section"
          id="pegasus"
          aria-labelledby="lab-title"
        >
          <p className="eyebrow">The organisation behind the work</p>
          <div className="lab-intro">
            <h2 id="lab-title">Pegasus</h2>
            <div className="lab-copy">
              <p>
                A small lab with a simple ambition: build and operate a
                portfolio of profitable SaaS businesses with exceptional people.
              </p>
              <p>
                Over time, new products—and potentially acquisitions—will join
                the lab. Each should benefit from the customer understanding,
                distribution, and experience of the last.
              </p>
            </div>
          </div>
          <div className="principles">
            <div>
              <span className="principle-number">01</span>
              <h3>Small by design.</h3>
              <p>
                The plan is fewer than ten people, working closely across the
                portfolio.
              </p>
            </div>
            <div>
              <span className="principle-number">02</span>
              <h3>Learning that carries forward.</h3>
              <p>
                Turn what works into shared capabilities that help the next
                product.
              </p>
            </div>
            <div>
              <span className="principle-number">03</span>
              <h3>Built to keep building.</h3>
              <p>Aim for sustainable businesses that fund the next chapter.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>© 2026 safoan.inc</span>
        <a href="#top">
          Back to top <span aria-hidden="true">↑</span>
        </a>
      </footer>
    </div>
  );
}
