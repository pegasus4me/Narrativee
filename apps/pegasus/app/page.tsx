import Image from "next/image";

export default function Home() {
  return (
    <div className="shell">
      <header>
        <a className="wordmark" href="/" aria-label="safoan.inc home">
          safoan.inc
        </a>
      </header>

      <main>
        <section aria-labelledby="lab-title">
          <h2 className="lab-logo" id="lab-title">
            <Image
              src="/pegasus-logo.png"
              alt="Pegasus"
              width={1806}
              height={871}
              unoptimized
            />
          </h2>
          <p className="about">
            My independent software lab. The ambition is a small team building
            profitable SaaS businesses. Right now, I’m focused on Narrativee.
          </p>
        </section>

        <section aria-labelledby="projects-title">
          <h2 id="projects-title">Currently building</h2>
          <a
            className="project"
            href="https://narrativee.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="project-copy">
              <Image
                className="project-logo"
                src="/narrativee-logo.png"
                alt="Narrativee"
                width={2511}
                height={480}
                unoptimized
              />
              <span>AI brand designer for social posts and ads.</span>
            </span>
            <span className="arrow" aria-hidden="true">
              ↗
            </span>
            <span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        </section>
      </main>
    </div>
  );
}
